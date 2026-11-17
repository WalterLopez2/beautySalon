// Revisa que no se suban secretos al repositorio. Corre en CI y se puede
// correr a mano con:  pnpm verificar:secretos
//
// Falla si:
//   1. Git sigue algun archivo .env real (solo se permiten los .env.example).
//   2. Algun .env.example trae un valor en una variable sensible
//      (contrasenas, secretos, claves, usuarios). Esas deben quedar vacias.
//   3. Algun .env.example trae una URL con usuario:contrasena@.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const NOMBRE_SENSIBLE = /(PASS|CONTRASENA|SECRET|SECRETO|CLAVE|KEY|TOKEN|USER|USUARIO|CREDENCIAL)/i;
const URL_CON_CREDENCIALES = /[a-z][a-z0-9+.-]*:\/\/[^\s:/@]+:[^\s@/]+@/i;
const ES_ENV = /(^|\/)\.env(\.[^/]*)?$/;
const ES_EJEMPLO = /\.env\.example$/;

const archivosSeguidos = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean);

const problemas = [];

for (const archivo of archivosSeguidos.filter((a) => ES_ENV.test(a))) {
  if (!ES_EJEMPLO.test(archivo)) {
    problemas.push(`${archivo}: es un archivo .env real y no debe estar en el repositorio (git rm --cached ${archivo}).`);
    continue;
  }

  const lineas = readFileSync(archivo, 'utf8').split(/\r?\n/);
  lineas.forEach((linea, i) => {
    const texto = linea.trim();
    if (!texto || texto.startsWith('#')) return;

    const igual = texto.indexOf('=');
    if (igual === -1) return;

    const nombre = texto.slice(0, igual).replace(/^export\s+/, '').trim();
    const valor = texto.slice(igual + 1).trim().replace(/^["']|["']$/g, '');
    const lugar = `${archivo}:${i + 1}`;

    if (NOMBRE_SENSIBLE.test(nombre) && valor !== '') {
      problemas.push(`${lugar}: ${nombre} debe quedar vacio en el ejemplo (cada quien pone el suyo en su .env).`);
    }
    if (URL_CON_CREDENCIALES.test(valor)) {
      problemas.push(`${lugar}: ${nombre} tiene una URL con usuario y contrasena.`);
    }
  });
}

if (problemas.length > 0) {
  console.error('Se encontraron posibles secretos en el repositorio:\n');
  for (const p of problemas) console.error(`  - ${p}`);
  console.error('\nSi un secreto real llego a subirse, hay que cambiarlo (rotarlo): borrarlo del archivo no lo saca del historial.');
  process.exit(1);
}

console.log('Sin secretos: ningun .env real seguido por git y los .env.example no traen valores sensibles.');
