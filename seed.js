// Usage: node seed.js [apiBase]   (Node 18+)  e.g. node seed.js http://localhost:5000/api/tasks
const tasks = require('./tasks-seed.json');
const API = process.argv[2] || 'http://localhost:5000/api/tasks';

(async () => {
  let ok = 0;
  for (const t of tasks) {
    const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(t) });
    if (res.ok) { ok++; console.log('created:', t.title); }
    else console.error('FAILED:', t.title, await res.text());
  }
  console.log(`\nDone: ${ok}/${tasks.length} inserted`);
})();
