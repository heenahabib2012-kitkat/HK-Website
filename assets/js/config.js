/* ==========================================================================
   HK — Site configuration (EDIT ME)
   --------------------------------------------------------------------------
   photos: drop optimised WebP/AVIF files into assets/img/photos/ and set the
           paths. Empty slots fall back to the built-in drawings, so the
           site always looks complete.
   formEndpoint: URL that accepts a POST of the enquiry form (FormData),
           e.g. a Formspree / Basin / your own endpoint. While empty the form
           validates and shows the confirmation message but sends nothing.
   ========================================================================== */
window.HK = window.HK || {};
window.HK.config = {
  formEndpoint: '',

  photos: {
    // The Ascent (index.html)
    chairman: '',   // Chairman portrait, ~900x1100, e.g. 'assets/img/photos/chairman.webp'
    // Lattice (lattice.html)
    heroView: '',   // Dubai skyline seen through the hero lattice window, ~1200x1600 portrait
    about: '',      // Arched photo in About, ~900x1350 portrait
    kuwait: '',     // Journey arch 1: Kuwait (e.g. Kuwait Towers), ~1000x1200
    dubai: '',      // Journey arch 2: Dubai (e.g. Burj Khalifa / Downtown), ~1000x1200
    world: ''       // Journey arch 3: global (e.g. a world city or aerial view), ~1000x1200
  }
};
