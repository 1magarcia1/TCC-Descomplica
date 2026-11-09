const mapForm = document.getElementById('lawyerMapForm');
const mapLocation = document.getElementById('lawyerMapLocation');
const mapFrame = document.getElementById('lawyerMap');
const mapLink = document.getElementById('openLawyerMap');
const mapMessage = document.getElementById('lawyerMapMessage');
const locationButton = document.getElementById('useMyLocation');

function showLawyersAt(location) {
  const query = `advogados em ${location}`;
  mapFrame.src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
  mapLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  mapMessage.textContent = `Exibindo resultados do Google Maps para ${location}.`;
}

mapForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const location = mapLocation.value.trim();
  if (!location) {
    mapMessage.textContent = 'Informe uma cidade, bairro ou endereço para buscar.';
    mapLocation.focus();
    return;
  }
  showLawyersAt(location);
});

locationButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    mapMessage.textContent = 'Este navegador não oferece acesso à localização. Digite sua cidade ou bairro para buscar.';
    return;
  }

  locationButton.disabled = true;
  mapMessage.textContent = 'Obtendo sua localização...';
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      const location = `${coords.latitude},${coords.longitude}`;
      mapLocation.value = 'Minha localização';
      showLawyersAt(location);
      locationButton.disabled = false;
    },
    (error) => {
      const messages = {
        1: 'Permissão de localização negada. Digite sua cidade ou bairro para buscar.',
        2: 'Não foi possível determinar sua localização. Digite sua cidade ou bairro para buscar.',
        3: 'A solicitação de localização expirou. Tente novamente ou digite sua cidade.'
      };
      mapMessage.textContent = messages[error.code] || 'Não foi possível obter sua localização. Digite sua cidade ou bairro para buscar.';
      locationButton.disabled = false;
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
  );
});
