(function(){
  // 판매 설정 — 가격이 확정되면 price 값을 넣으면 안내 문구가 자동으로 바뀝니다.
  var PRODUCT={price:null,currency:'KRW'};
  var $=function(s,r){return(r||document).querySelector(s)};
  var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  var tints={sage:[.65,.68,.6],sand:[.79,.73,.6],slate:[.46,.49,.47],rose:[.71,.56,.54]};

  // reveal on scroll
  var io='IntersectionObserver' in window?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12}):null;
  $$('.reveal').forEach(function(el){io?io.observe(el):el.classList.add('in')});

  if(PRODUCT.price){$('#price').textContent=new Intl.NumberFormat('ko-KR',{style:'currency',currency:PRODUCT.currency,maximumFractionDigits:0}).format(PRODUCT.price)}

  // color selection (shared between viewer section and buy card)
  var mv=$('#mv'),current='sage';
  function tint(){
    var m=mv.model&&mv.model.materials&&mv.model.materials[0];
    if(m)m.pbrMetallicRoughness.setBaseColorFactor(tints[current].concat(1));
  }
  mv.addEventListener('load',function(){var m=mv.model.materials[0];if(m){m.pbrMetallicRoughness.setMetallicFactor(0);m.pbrMetallicRoughness.setRoughnessFactor(.85)}tint()});
  function setColor(key,name){
    current=key;
    $('#colorImg').src='assets/img/color-'+key+'.webp';
    $('#buyImg').src='assets/img/color-'+key+'.webp';
    $('#colorName').textContent=name;$('#buyColor').textContent=name;
    $$('.sw[data-key]').forEach(function(b){var on=b.dataset.key===key;b.classList.toggle('is-on',on);if(b.hasAttribute('role'))b.setAttribute('aria-checked',on)});
    tint();
  }
  $$('.sw[data-key]').forEach(function(b){b.addEventListener('click',function(){setColor(b.dataset.key,b.dataset.name)})});

  // waitlist
  $('#waitlist').addEventListener('submit',function(e){
    e.preventDefault();
    var v=$('#email').value.trim(),msg=$('#msg');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)){msg.className='msg err';msg.textContent='이메일 주소를 확인해 주세요.';return}
    try{var l=JSON.parse(localStorage.getItem('pauze_waitlist')||'[]');l.push({email:v,color:current,at:Date.now()});localStorage.setItem('pauze_waitlist',JSON.stringify(l))}catch(_){}
    msg.className='msg ok';msg.textContent='사전 신청이 완료되었습니다. 출시 소식을 가장 먼저 전해드릴게요.';
    $('#email').value='';
  });
})();
