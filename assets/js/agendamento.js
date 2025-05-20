document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('agendamentoForm')
  const dataInput = document.getElementById('data')
  const horaSelect = document.getElementById('hora')
  const telefoneInput = document.getElementById('telefone')
  const radiosServicos = document.querySelectorAll('input[type="radio"]')
  
  // Variáveis para controle de agendamentos
  let agendamentos = JSON.parse(localStorage.getItem('agendamentos')) || []
  const DURACAO_PADRAO_MINUTOS = 180 // 3 horas de bloqueio padrão

  // Impede datas passadas
  const hoje = new Date()
  dataInput.min = hoje.toISOString().split('T')[0]

  // Formatação de telefone dinâmica
  telefoneInput.addEventListener('input', () => {
    telefoneInput.value = formatarTelefone(telefoneInput.value)
  })

  // Atualiza horários quando muda a data ou profissional
  dataInput.addEventListener('change', atualizarHorariosDisponiveis)
  radiosServicos.forEach(radio => {
    radio.addEventListener('change', atualizarHorariosDisponiveis)
  })

  function formatarTelefone(valor) {
    const numeros = valor.replace(/\D/g, '')

    if (numeros.length === 0) return ''

    if (numeros.length <= 2) {
      return `(${numeros}`
    }

    if (numeros.length <= 6) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`
    }

    if (numeros.length <= 10) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`
    }

    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`
  }

  function getProfissionalSelecionado() {
    for (const radio of radiosServicos) {
      if (radio.checked) return radio.value
    }
    return null
  }

  function getServicoSelecionado() {
    const profissional = getProfissionalSelecionado()
    if (!profissional) return null
    
    // Encontra o grupo (name) do radio button selecionado
    const grupo = document.querySelector(`input[type="radio"][value="${profissional}"]`).name
    return grupo.charAt(0).toUpperCase() + grupo.slice(1) // Capitaliza primeira letra
  }

  function atualizarHorariosDisponiveis() {
    const profissional = getProfissionalSelecionado()
    const dataSelecionada = new Date(dataInput.value + 'T12:00:00')
    const diaSemana = dataSelecionada.getDay()
    const hojeStr = new Date().toDateString()

    if (!profissional) {
      horaSelect.innerHTML = '<option disabled selected>Selecione um profissional primeiro</option>'
      horaSelect.disabled = true
      return
    }

    if (diaSemana === 0 || diaSemana === 1) { // Domingo (0) ou Segunda (1)
      horaSelect.innerHTML = '<option disabled>❌ Fechado aos domingos e segundas</option>'
      horaSelect.disabled = true
      alert('Atendemos de terça a sábado.')
      return
    }

    horaSelect.innerHTML = '<option disabled selected>⏳ Carregando horários...</option>'
    horaSelect.disabled = false

    // Filtra agendamentos para o dia e profissional selecionados
    const agendamentosDia = agendamentos.filter(ag => {
      const agDate = new Date(ag.inicio)
      return agDate.toDateString() === dataSelecionada.toDateString() && 
             ag.profissional === profissional
    })

    // Gera horários disponíveis (9h às 19h)
    const horariosDisponiveis = []
    const HORA_INICIO = 9
    const HORA_FIM = 19

    for (let hora = HORA_INICIO; hora < HORA_FIM; hora++) {
      for (let minuto = 0; minuto < 60; minuto += 30) {
        const horario = new Date(dataSelecionada)
        horario.setHours(hora, minuto, 0, 0)
        
        // Formata para exibição (09:00)
        const horaFormatada = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`
        
        // Verifica se horário já passou (para o dia atual)
        if (dataSelecionada.toDateString() === hojeStr && horario <= new Date()) {
          horariosDisponiveis.push(`<option value="${horaFormatada}" disabled>${horaFormatada} (passado)</option>`)
          continue
        }
        
        // Verifica se horário está disponível
        const horarioDisponivel = verificarDisponibilidadeHorario(
          horario, 
          DURACAO_PADRAO_MINUTOS, 
          agendamentosDia
        )
        
        if (horarioDisponivel) {
          horariosDisponiveis.push(`<option value="${horaFormatada}">${horaFormatada}</option>`)
        } else {
          horariosDisponiveis.push(`<option value="${horaFormatada}" disabled>${horaFormatada} (indisponível)</option>`)
        }
      }
    }

    horaSelect.innerHTML = horariosDisponiveis.length > 0 
      ? '<option value="" disabled selected>Selecione um horário</option>' + horariosDisponiveis.join('')
      : '<option value="" disabled>Nenhum horário disponível</option>'
  }

  function verificarDisponibilidadeHorario(horarioInicio, duracaoMinutos, agendamentosDia) {
    const horarioFim = new Date(horarioInicio.getTime() + duracaoMinutos * 60000)
    
    for (const agendamento of agendamentosDia) {
      const inicioExistente = new Date(agendamento.inicio)
      const fimExistente = new Date(agendamento.fim)
      
      // Verifica sobreposição de horários
      if (
        (horarioInicio >= inicioExistente && horarioInicio < fimExistente) ||
        (horarioFim > inicioExistente && horarioFim <= fimExistente) ||
        (horarioInicio <= inicioExistente && horarioFim >= fimExistente)
      ) {
        return false // Conflito de horário
      }
    }
    
    return true // Horário disponível
  }

  // Submissão do formulário
  form.addEventListener('submit', (e) => {
    e.preventDefault()

    const nome = document.getElementById('nome').value
    const telefone = document.getElementById('telefone').value
    const data = dataInput.value
    const hora = horaSelect.value
    const profissional = getProfissionalSelecionado()
    const servico = getServicoSelecionado()

    if (!profissional) {
      alert('Selecione um profissional!')
      return
    }

    if (!data || !hora) {
      alert('Preencha todos os campos!')
      return
    }

    const [ano, mes, dia] = data.split('-')
    const [h, min] = hora.split(':')
    const dataISO = new Date(ano, mes - 1, dia, h, min)
    const dataFim = new Date(dataISO.getTime() + DURACAO_PADRAO_MINUTOS * 60000)
    const dataFormatada = `${dia}/${mes}/${ano}`

    // Cria objeto de agendamento
    const agendamento = {
      id: 'ag-' + Date.now(),
      nome: nome,
      telefone: telefone,
      profissional: profissional,
      servico: servico,
      inicio: dataISO.toISOString(),
      fim: dataFim.toISOString(),
      dataCriacao: new Date().toISOString()
    }

    // Salva no localStorage
    agendamentos.push(agendamento)
    localStorage.setItem('agendamentos', JSON.stringify(agendamentos))

    const detalhes = `Olá ${nome}, seu agendamento para ${servico} com ${profissional} no dia ${dataFormatada} às ${hora} foi confirmado!`
    document.getElementById('confirmacaoTexto').textContent = detalhes

    const calendarLink = gerarLinkGoogleCalendar(nome, telefone, servico, profissional, dataISO)
    document.getElementById('googleCalendarLink').href = calendarLink

    const whatsappLink = gerarLinkWhatsApp(nome, telefone, servico, profissional, dataFormatada, hora)
    document.getElementById('whatsappLink').href = whatsappLink

    new bootstrap.Modal(document.getElementById('confirmacaoModal')).show()
  })

  // Gera link do Google Calendar com horário CORRETO (solução definitiva)
  function gerarLinkGoogleCalendar(nome, telefone, servico, profissional, inicio) {
    // Cria novas datas para evitar modificação do objeto original
    const inicioEvento = new Date(inicio);
    const fimEvento = new Date(inicioEvento.getTime() + DURACAO_PADRAO_MINUTOS * 60000);

    // Formata as datas no formato YYYYMMDDTHHmmss
    const formatarData = (date) => {
        const ano = date.getFullYear();
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        const dia = String(date.getDate()).padStart(2, '0');
        const horas = String(date.getHours()).padStart(2, '0');
        const minutos = String(date.getMinutes()).padStart(2, '0');
        return `${ano}${mes}${dia}T${horas}${minutos}00`;
    };

    const emailConvidado = 'nandashalomadonai@gmail.com';

    return `https://www.google.com/calendar/render?action=TEMPLATE` +
        `&text=${encodeURIComponent('Agendamento Shalom Adonai - ' + nome.split(' ')[0])}` +
        `&dates=${formatarData(inicioEvento)}/${formatarData(fimEvento)}` +
        `&details=${encodeURIComponent(
          `Cliente: ${nome}\nTelefone: ${telefone}\nServiço: ${servico}\nProfissional: ${profissional}`
        )}` +
        `&location=${encodeURIComponent('Salão Shalom Adonai, Rua Nhatumani, 496')}` +
        `&add=${encodeURIComponent(emailConvidado)}` +
        `&ctz=America/Sao_Paulo` +
        `&sf=true&output=xml`;
  }

  // Gera link do WhatsApp (atualizado para incluir o profissional)
  function gerarLinkWhatsApp(nome, telefone, servico, profissional, data, hora) {
    const texto = `Olá Nanda - Shalom Adonai! Confirme meu agendamento:\n\n` +
      `*Nome:* ${nome}\n*Telefone:* ${telefone}\n*Data:* ${data} às ${hora}\n` +
      `*Serviço:* ${servico}\n*Profissional:* ${profissional}\n\nPor favor, confirme.`
    return `https://wa.me/5511917742509?text=${encodeURIComponent(texto)}`
  }
})