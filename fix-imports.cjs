const fs = require('fs');
const path = require('path');

const tabsDir = path.join(__dirname, 'src', 'options', 'components', 'tabs');
const subDirs = fs.readdirSync(tabsDir).filter(f => fs.statSync(path.join(tabsDir, f)).isDirectory());

subDirs.forEach(subDir => {
    const dirPath = path.join(tabsDir, subDir);
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.vue') || f.endsWith('.js'));
    
    files.forEach(file => {
        const filePath = path.join(dirPath, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Fix common components imports
        content = content.replace(/from\s+['"]\.\.\/common\/(.*)['"]/g, "from '../../common/$1'");
        content = content.replace(/from\s+['"]\.\/common\/(.*)['"]/g, "from '../../common/$1'");
        
        // Fix composables imports
        content = content.replace(/from\s+['"]\.\.\/composables\/(.*)['"]/g, "from '../../../composables/$1'");
        content = content.replace(/from\s+['"]\.\.\/\.\.\/composables\/(.*)['"]/g, "from '../../../composables/$1'");
        
        // Fix scripts imports
        content = content.replace(/from\s+['"]\.\.\/scripts\/(.*)['"]/g, "from '../../../scripts/$1'");
        content = content.replace(/from\s+['"]\.\.\/\.\.\/scripts\/(.*)['"]/g, "from '../../../scripts/$1'");
        content = content.replace(/from\s+['"]\.\.\/\.\.\/\.\.\/scripts\/(.*)['"]/g, "from '../../../../scripts/$1'"); // Wait, from tabs/Library/LibraryHeader.vue to src/scripts/core is ../../../../scripts/core
        
        // Fix sibling components imports (was ../Component.vue or ./Component.vue)
        // If they imported a sibling using '../Component.vue', it should now be './Component.vue'
        // But what about 'import LibraryStatistics from '../LibraryStatistics.vue';'?
        content = content.replace(/from\s+['"]\.\.\/([A-Za-z0-9_-]+\.vue)['"]/g, (match, p1) => {
            // Is it a sibling?
            if (files.includes(p1)) {
                return `from './${p1}'`;
            } else {
                console.log(`Warning: Unresolved sibling import in ${file}: ${p1}`);
                return match; // Leave untouched for manual inspection
            }
        });

        // Config js
        content = content.replace(/from\s+['"]\.\.\/\.\.\/config\.js['"]/g, "from '../../../../config.js'");
        content = content.replace(/from\s+['"]\.\.\/\.\.\/\.\.\/config\.js['"]/g, "from '../../../../config.js'");

        fs.writeFileSync(filePath, content, 'utf8');
    });
});

console.log("Paths updated in sub-folders.");
