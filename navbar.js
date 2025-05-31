document.addEventListener("DOMContentLoaded", function() {
  fetch('navbar.html')
    .then(response => response.text())
    .then(data => {
      document.getElementById('navbar').innerHTML = data;
      // Highlight the current page
      const path = window.location.pathname.split('/').pop();
      document.querySelectorAll('.nav-bar a').forEach(link => {
        if (
          (path === '' || path === 'index.html') && link.getAttribute('href') === 'index.html' ||
          path === link.getAttribute('href')
        ) {
          link.parentElement.classList.add('active');
        }
      });

      const navBar = document.querySelector('.nav-bar');
      if (navBar && !document.querySelector('.nav-slider-bg')) {
        const slider = document.createElement('div');
        slider.className = 'nav-slider-bg';
        navBar.appendChild(slider);

        function setSliderInstant() {
          const active = navBar.querySelector('.nav-item.active a');
          if (active) {
            const rect = active.getBoundingClientRect();
            const navRect = navBar.getBoundingClientRect();
            slider.style.transition = 'none';
            slider.style.width = rect.width + 'px';
            slider.style.left = (rect.left - navRect.left) + 'px';
          }
        }

        function moveSliderToActive() {
          const active = navBar.querySelector('.nav-item.active a');
          if (active) {
            const rect = active.getBoundingClientRect();
            const navRect = navBar.getBoundingClientRect();
            slider.style.transition = 'all 0.3s cubic-bezier(0.33, 1, 0.68, 1)';
            slider.style.width = rect.width + 'px';
            slider.style.left = (rect.left - navRect.left) + 'px';
          }
        }

        // Set instantly, then enable transition after a tick
        setSliderInstant();
        setTimeout(moveSliderToActive, 10);

        window.addEventListener('resize', moveSliderToActive);

        // Animate on hover as well
        navBar.querySelectorAll('.nav-item a').forEach(link => {
          link.addEventListener('mouseenter', function() {
            const rect = link.getBoundingClientRect();
            const navRect = navBar.getBoundingClientRect();
            slider.style.transition = 'all 0.3s cubic-bezier(0.33, 1, 0.68, 1)';
            slider.style.width = rect.width + 'px';
            slider.style.left = (rect.left - navRect.left) + 'px';
          });
          link.addEventListener('mouseleave', moveSliderToActive);
        });
      }
    });
});