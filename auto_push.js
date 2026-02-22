import { exec } from 'child_process';

console.log('🔄 Cambios detectados. Iniciando sincronización a GitHub...');

exec('git add . && git commit -m "Auto-update: Cambios en el código" && git push', (error, stdout, stderr) => {
    if (error) {
        console.error(`❌ Error durante el auto-push:\n`, stderr);
        return;
    }
    console.log(`✅ ¡Cambios guardados en GitHub con éxito!\n`, stdout);
});
