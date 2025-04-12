document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('agendamentoForm');
  const dataInput = document.getElementById('data');
  const horaSelect = document.getElementById('hora');
  const telefoneInput = document.getElementById('telefone');

  // Impede datas passadas
  const hoje = new Date();
  dataInput.min = hoje.toISOString().split('T')[0];

  // === FORMATAÇÃO DE TELEFONE DINÂMICA ===
  telefoneInput.addEventListener('input', () => {
    telefoneInput.value = formatarTelefone(telefoneInput.value);
  });

  function formatarTelefone(valor) {
    const numeros = valor.replace(/\D/g, '');

    if (numeros.length === 0) return '';

    if (numeros.length <= 2) {
      return `(${numeros}`;
    }

    if (numeros.length <= 6) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    }

    if (numeros.length <= 10) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
    }

    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
  }

  // === ATUALIZA HORÁRIOS AO MUDAR A DATA ===
  dataInput.addEventListener('change', () => {
    const data = new Date(dataInput.value + 'T12:00:00');
    const diaSemana = data.getDay();
    const hojeStr = new Date().toDateString();

    if (diaSemana === 0 || diaSemana === 1) {
      horaSelect.innerHTML = `<option>❌ Fechado aos domingos e segundas</option>`;
      alert('Atendemos de terça a sábado.');
      return;
    }

    horaSelect.innerHTML = `<option disabled selected>⏳ Carregando horários...</option>`;
    const horarios = [];
    const inicio = 9;
    const fim = 19;
    const agora = new Date();

    for (let h = inicio; h < fim; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hora = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const horaCompleta = new Date(`${dataInput.value}T${hora}`);

        if (data.toDateString() === hojeStr && horaCompleta <= agora) continue;

        horarios.push(`<option value="${hora}">${hora}</option>`);
      }
    }

    horaSelect.innerHTML = horarios.length
      ? `<option disabled selected>Escolha um horário</option>` + horarios.join('')
      : `<option>😢 Nenhum horário disponível</option>`;
  });

  // === SUBMISSÃO DO FORMULÁRIO ===
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nome = document.getElementById('nome').value;
    const telefone = document.getElementById('telefone').value;
    const data = dataInput.value;
    const hora = horaSelect.value;

    // Coleta os serviços selecionados dos checkboxes
    const checkboxes = document.querySelectorAll('input[name="servicos[]"]:checked');
    const servicos = Array.from(checkboxes).map(checkbox => checkbox.value);
    if (servicos.length === 0) {
      alert('Selecione pelo menos um serviço!');
      return;
    }

    if (!data || !hora) {
      alert('Preencha todos os campos!');
      return;
    }

    const [ano, mes, dia] = data.split('-');
    const [h, min] = hora.split(':');
    const dataISO = new Date(ano, mes - 1, dia, h, min);
    const dataFormatada = `${dia}/${mes}/${ano}`;

    const servicosTexto = servicos.join(', ');
    const detalhes = `Olá ${nome}, seu agendamento para ${servicosTexto} no dia ${dataFormatada} às ${hora} foi confirmado!`;
    document.getElementById('confirmacaoTexto').textContent = detalhes;

    const calendarLink = gerarLinkGoogleCalendar(nome, telefone, servicosTexto, dataISO);
    document.getElementById('googleCalendarLink').href = calendarLink;

    const whatsappLink = gerarLinkWhatsApp(nome, telefone, servicosTexto, dataFormatada, hora);
    document.getElementById('whatsappLink').href = whatsappLink;

    new bootstrap.Modal(document.getElementById('confirmacaoModal')).show();
  });

  // === GERA LINK DO GOOGLE CALENDAR COM CONVIDADO ===
  function gerarLinkGoogleCalendar(nome, telefone, servico, inicio) {
    const fim = new Date(inicio.getTime() + 60 * 60000); // Assume 1 hora por padrão
    const format = d => d.toISOString().replace(/[-:]/g, '').split('.')[0];
    const emailConvidado = 'dantasandrew05@gmail.com';

    return `https://www.google.com/calendar/render?action=TEMPLATE` +
      `&text=Agendamento+Shalom+Adonai+-+${nome.split(' ')[0]}` +
      `&dates=${format(inicio)}/${format(fim)}` +
      `&details=Cliente:${nome}%0ATelefone:${telefone}%0AServiço:${servico}` +
      `&location=Salão+Shalom+Adonai,+Rua+Nhatumani,+496` +
      `&add=${encodeURIComponent(emailConvidado)}` +
      `&sf=true&output=xml`;
  }

  // === GERA LINK DO WHATSAPP ===
  function gerarLinkWhatsApp(nome, telefone, servico, data, hora) {
    const texto = `Olá Shalom Adonai! Confirme meu agendamento:\n\n` +
      `*Nome:* ${nome}\n*Telefone:* ${telefone}\n*Data:* ${data} às ${hora}\n*Serviço:* ${servico}\n\nPor favor, confirme.`;
    return `https://wa.me/5511967036990?text=${encodeURIComponent(texto)}`;
  }
});