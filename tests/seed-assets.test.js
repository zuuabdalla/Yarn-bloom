const fs = require('fs');
const path = require('path');

describe('seed catalogue images', () => {
  test('references image assets that exist in the public directory', () => {
    const seedFile = path.join(__dirname, '..', 'database', 'seed.sql');
    const publicDirectory = path.join(__dirname, '..', 'public');
    const seedSql = fs.readFileSync(seedFile, 'utf8');
    const imagePaths = [...seedSql.matchAll(/'((?:\/images\/)[^']+)'/g)].map((match) => match[1]);

    expect(imagePaths.length).toBeGreaterThan(0);
    for (const imagePath of new Set(imagePaths)) {
      expect(fs.existsSync(path.join(publicDirectory, imagePath.slice(1)))).toBe(true);
    }
  });
});
