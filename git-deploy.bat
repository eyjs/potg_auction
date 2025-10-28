@echo off
setlocal

echo ===================================================
echo Simple Git Deploy Script for static HTML project
echo ===================================================

REM === 커밋 메시지 입력 ===
set /p commitMsg=Commit message (기본값: chore: deploy):
if "%commitMsg%"=="" set commitMsg=chore: deploy

echo ---------------------------------------------------
echo Commit message: %commitMsg%
echo ---------------------------------------------------

REM === 현재 브랜치명 확인 ===
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
echo Current branch: %CURRENT_BRANCH%

REM === 변경사항 커밋 및 푸시 ===
git add .
git commit -m "%commitMsg%"
git push origin %CURRENT_BRANCH%

REM === gh-pages 브랜치로 배포 ===
echo ---------------------------------------------------
echo Deploying to gh-pages...
echo ---------------------------------------------------

git fetch origin
git checkout gh-pages

REM === 현재 브랜치의 최신 변경내용 덮어쓰기 ===
git merge %CURRENT_BRANCH% --no-edit

git push origin gh-pages

REM === 다시 원래 브랜치로 돌아가기 ===
git checkout %CURRENT_BRANCH%

echo ---------------------------------------------------
echo ✅ Deploy completed successfully.
echo ===================================================

endlocal
pause
