const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../src/data/products.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const moduleExports = {};
new Function('exports', compiled.outputText)(moduleExports);
const { products, getProductImages, getProduct, formatBRL } = moduleExports;

test('24 unique approved prints, each at R$ 99 with P/M/G/GG and no invented stock', () => {
  assert.equal(products.length, 24);
  assert.equal(new Set(products.map(p => p.id)).size, 24);
  assert.equal(new Set(products.map(p => p.slug)).size, 24);
  for (const p of products) {
    assert.match(p.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.equal(p.price, 99);
    assert.equal(formatBRL(p.price).replace(/\s/g, ' '), 'R$ 99,00');
    assert.deepEqual(p.sizes, ['P', 'M', 'G', 'GG']);
    assert.equal(p.stock, undefined);
    assert.ok(p.description && p.story);
    assert.equal(getProduct(p.slug), p);
  }
});

test('all 69 photos exist and every color gallery stays within its own print', () => {
  const allImages = products.flatMap(p => p.images);
  assert.equal(allImages.length, 69);
  assert.equal(new Set(allImages).size, 69);
  for (const p of products) {
    assert.equal(p.colors.length, ['tudo-e-possivel', 'ovelha-perdida-ele-veio-me-buscar', 'flowjesus-grappling-club-jesus-salves'].includes(p.slug) ? 1 : 2);
    assert.equal(p.colors[0].name === 'Branco' || p.colors[0].name === 'Preto', true);
    const gallery = [];
    for (const color of p.colors) {
      const images = getProductImages(p, color.name);
      const original = products.indexOf(p) < 13;
      assert.equal(images.length, original ? 2 : 1);
      if (original) {
        assert.match(images[0], /-verso-/);
        assert.match(images[1], /-frente-/);
      }
      for (const image of images) {
        const prefix = p.category === 'jiu-jitsu-lifestyle'
          ? `/images/products/jiu-jitsu-lifestyle/${p.slug}-`
          : `/images/products/${p.slug}/`;
        assert.ok(image.startsWith(prefix));
        assert.ok(fs.statSync(path.join(__dirname, '../public', image)).size > 0);
      }
      gallery.push(...images);
    }
    assert.deepEqual([...new Set(gallery)], p.images);
    assert.deepEqual(getProductImages(p, "Azul"), []);
  }
  assert.deepEqual(getProduct('tudo-e-possivel').colors.map(c => c.name), ['Branco']);
});

test('only references explicitly printed on the supplied designs are attributed', () => {
  assert.deepEqual(Object.fromEntries(products.filter(p => p.biblicalReference).map(p => [p.slug, p.biblicalReference])), {
    '70x7': 'Mateus 18:22',
    'ovelha-perdida-ele-veio-me-buscar': 'Lucas 15:4-6',
    'andamos-por-fe': '2 Coríntios 5:7',
    'tudo-e-possivel': 'Mateus 19:26',
    'you-are-the-salt-of-the-earth': 'Mateus 5:13',
    'ele-nos-amou-primeiro': '1 João 4:19',
    'tudo-posso-naquele-que-me-fortalece': 'Filipenses 4:13',
  });
});
