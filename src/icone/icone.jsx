import { ICONES } from '../icone/icones.js';

export default function Icone({ nome, classe = 'icone' }) {
  return <span className={classe} aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONES[nome] }} />;
}
