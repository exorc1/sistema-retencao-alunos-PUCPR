@echo off
echo Enviando projeto para o GitHub...

git add .
git commit -m "%date% %time% auto update"
git push

echo ✅ Push finalizado!
pause