document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('agendamentoForm');
  const dataInput = document.getElementById('data');
  const horaSelect = document.getElementById('hora');

  // Impede datas passadas
  const hoje = new Date();
  dataInput.min = hoje.toISOString().split('T')[0];

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

    horaSelect.innerHTML = horarios.length ? `<option disabled selected>Escolha um horário</option>` + horarios.join('')
      : `<option>😢 Nenhum horário disponível</option>`;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nome = document.getElementById('nome').value;
    const telefone = document.getElementById('telefone').value;
    const servico = document.getElementById('servico').value;
    const data = dataInput.value;
    const hora = horaSelect.value;

    if (!data || !hora || !servico) return alert('Preencha todos os campos!');

    const [ano, mes, dia] = data.split('-');
    const [h, min] = hora.split(':');
    const dataISO = new Date(ano, mes - 1, dia, h, min);
    const dataFormatada = `${dia}/${mes}/${ano}`;

    const detalhes = `Olá ${nome}, seu agendamento para ${servico} no dia ${dataFormatada} às ${hora} foi confirmado!`;
    document.getElementById('confirmacaoTexto').textContent = detalhes;

    const calendarLink = gerarLinkGoogleCalendar(nome, telefone, servico, dataISO);
    document.getElementById('googleCalendarLink').href = calendarLink;

    const whatsappLink = gerarLinkWhatsApp(nome, telefone, servico, dataFormatada, hora);
    document.getElementById('whatsappLink').href = whatsappLink;

    new bootstrap.Modal(document.getElementById('confirmacaoModal')).show();
  });

  function gerarLinkGoogleCalendar(nome, telefone, servico, inicio) {
    const fim = new Date(inicio.getTime() + (servico.includes("Manicure") ? 30 : 60) * 60000);
    const format = d => d.toISOString().replace(/[-:]/g, '').split('.')[0];

    return `https://www.google.com/calendar/render?action=TEMPLATE` +
      `&text=Agendamento+Shalom+Adonai+-+${nome.split(' ')[0]}` +
      `&dates=${format(inicio)}/${format(fim)}` +
      `&details=Cliente:${nome}%0ATelefone:${telefone}%0AServiço:${servico}` +
      `&location=Salão+Shalom+Adonai,+Rua+Nhatumani,+496` +
      `&sf=true&output=xml`;
  }

  function gerarLinkWhatsApp(nome, telefone, servico, data, hora) {
    const texto = `Olá Shalom Adonai! Confirme meu agendamento:\n\n` +
      `*Nome:* ${nome}\n*Telefone:* ${telefone}\n*Data:* ${data} às ${hora}\n*Serviço:* ${servico}\n\nPor favor, confirme.`;
    return `https://wa.me/5511967036990?text=${encodeURIComponent(texto)}`;
  }
});
