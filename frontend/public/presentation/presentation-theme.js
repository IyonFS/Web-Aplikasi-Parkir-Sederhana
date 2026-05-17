(() => {
  if (!document.body) {
    return;
  }

  const revealTargets = document.querySelectorAll(
    ".hero, .section, .panel, .footer"
  );

  revealTargets.forEach((element) => {
    element.classList.add("scroll-reveal");
    element.classList.add("is-visible");
  });
})();

