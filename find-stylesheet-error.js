// find-all-stylesheet-errors.js
// Script étendu pour trouver TOUTES les erreurs StyleSheet
const fs = require('fs');
const path = require('path');

const checkFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const errors = [];
    
    // Vérifier différents cas d'utilisation de StyleSheet
    const styleSheetPatterns = [
      /StyleSheet\.create/,
      /StyleSheet\./,
      /styles\s*=\s*StyleSheet/,
      /const\s+\w+\s*=\s*StyleSheet/
    ];
    
    let usesStyleSheet = false;
    styleSheetPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        usesStyleSheet = true;
      }
    });
    
    if (usesStyleSheet) {
      // Vérifier si StyleSheet est importé correctement
      const importPatterns = [
        /import\s+{[^}]*StyleSheet[^}]*}\s+from\s+['"]react-native['"]/,
        /import\s+\*\s+as\s+\w+\s+from\s+['"]react-native['"]/,
        /const\s+{[^}]*StyleSheet[^}]*}\s*=\s*require\(['"]react-native['"]\)/
      ];
      
      let hasImport = false;
      importPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          hasImport = true;
        }
      });
      
      if (!hasImport) {
        // Trouver les lignes où StyleSheet est utilisé
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('StyleSheet')) {
            errors.push({
              line: index + 1,
              code: line.trim()
            });
          }
        });
        
        return errors;
      }
    }
    
    return [];
  } catch (error) {
    console.error(`Erreur lors de la lecture de ${filePath}: ${error.message}`);
    return [];
  }
};

const scanDirectory = (dir, extensions = ['.js', '.jsx', '.ts', '.tsx']) => {
  let totalErrors = 0;
  
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      
      try {
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          // Ignorer certains dossiers
          const ignoreDirs = ['node_modules', '.git', '.expo', 'android', 'ios', 'build', 'dist'];
          if (!ignoreDirs.includes(file) && !file.startsWith('.')) {
            totalErrors += scanDirectory(filePath, extensions);
          }
        } else if (extensions.some(ext => file.endsWith(ext))) {
          const errors = checkFile(filePath);
          if (errors.length > 0) {
            console.log(`\n❌ Erreur trouvée dans : ${filePath}`);
            errors.forEach(error => {
              console.log(`   Ligne ${error.line}: ${error.code}`);
            });
            totalErrors += errors.length;
          }
        }
      } catch (error) {
        // Ignorer les erreurs de permission
      }
    });
  } catch (error) {
    console.error(`Erreur lors du scan du dossier ${dir}: ${error.message}`);
  }
  
  return totalErrors;
};

console.log('🔍 Recherche étendue des erreurs StyleSheet...\n');

// Scanner depuis la racine du projet
const rootErrors = scanDirectory('.', ['.js', '.jsx']);

// Vérifier aussi des fichiers spécifiques à la racine
const rootFiles = ['App.js', 'Navigation.js', 'index.js'];
rootFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const errors = checkFile(file);
    if (errors.length > 0) {
      console.log(`\n❌ Erreur trouvée dans : ${file}`);
      errors.forEach(error => {
        console.log(`   Ligne ${error.line}: ${error.code}`);
      });
    }
  }
});

if (rootErrors === 0) {
  console.log('\n✅ Aucune erreur StyleSheet trouvée !');
  console.log('\n💡 L\'erreur pourrait venir de :');
  console.log('   - Un module npm mal configuré');
  console.log('   - Un fichier dynamiquement importé');
  console.log('   - Une erreur dans les constantes/couleurs');
  
  // Vérifier si le fichier de couleurs existe
  if (fs.existsSync('constantes/couleurs.js')) {
    console.log('\n📝 Vérifiez constantes/couleurs.js');
  }
} else {
  console.log(`\n⚠️  Total: ${rootErrors} erreur(s) trouvée(s)`);
  console.log('\nPour corriger, ajoutez cet import en haut du fichier :');
  console.log("import { StyleSheet } from 'react-native';");
}