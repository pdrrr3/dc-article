import { render } from 'solid-js/web';
import './styles/main.css';
import './styles/typography.css';
import App from './App';

const root = document.getElementById('drone-interactive-root');
if (root) render(() => <App />, root);

// Hydrate the static article content (used to live inline in index.html)
fetch('/content.json')
  .then((r) => r.json())
  .then((data) => {
    document.querySelectorAll('[data-content]').forEach((el) => {
      const key = el.dataset.content;
      if (key === 'title_word_1') {
        if (data.title) el.textContent = data.title.split(' ')[0] || el.textContent;
      } else if (key === 'title_word_2') {
        if (data.title) el.textContent = data.title.split(' ').slice(1).join(' ') || el.textContent;
      } else if (data[key] !== undefined) {
        el.innerHTML = data[key];
      }
    });
  })
  .catch(() => {});
