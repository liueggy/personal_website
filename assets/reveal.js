(function() {
  function initReveal() {
    var elements = document.querySelectorAll('.reveal:not(.is-visible)');
    if (!elements.length) return;

    if (!('IntersectionObserver' in window)) {
      elements.forEach(function(el){ el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function(entries, obs) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          requestAnimationFrame(function(){
            el.classList.add('is-visible');
          });
          obs.unobserve(el);
        }
      });
    }, { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

    elements.forEach(function(el){ io.observe(el); });
  }

  // 初始化
  document.addEventListener('DOMContentLoaded', initReveal);
  
  // 暴露给全局，以便动态内容调用
  window.initReveal = initReveal;
})();
