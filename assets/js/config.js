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

/* Photography for The Boardroom (boardroom.html).
   Unsplash photos (Unsplash License: free for commercial use, no attribution
   required, though the footer credits Unsplash). Each loads over a drawn
   fallback, so a missing photo never breaks the layout. To use your own,
   replace a URL with a local path such as 'assets/img/photos/cover.webp'. */
(function () {
  var u = function (id, w) { return 'https://images.unsplash.com/' + id + '?auto=format&fit=crop&w=' + (w || 1200) + '&q=70'; };
  window.HK.config.boardroomPhotos = {
    cover: u('photo-1512453979798-5ea266f8880c', 1400),   // Dubai skyline
    origin1: u('photo-1518684079-3c830dcef090', 900),     // Dubai at dusk
    origin2: u('photo-1497366216548-37526070297c', 900),  // Modern office
    chairman: '',                                         // Chairman portrait (supply)
    read1: u('photo-1486406146926-c627a92ad1ab', 800),    // Glass towers
    read2: u('photo-1454165804606-c3d57bc86b40', 800),    // Planning documents
    read3: u('photo-1497366811353-6870744d04b2', 800),    // Office
    read4: u('photo-1451187580459-43490279c0fa', 800),    // Earth at night
    read5: u('photo-1556761175-5973dc0f32e7', 800),       // Meeting
    read6: u('photo-1449824913935-59a10b8d2000', 800)     // City skyline
  };
})();
