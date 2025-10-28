@echo off
setlocal enabledelayedexpansion

:: ================================================
:: 설정
:: ================================================
set "SRC_DIR=ClientApp"
set "BUILD_CMD=npm run build"
set "BUILD_DIR=%SRC_DIR%\dist"
set "GH_REMOTE=origin"
set "GH_PAGES_BRANCH=gh-pages"

:: ================================================
:: 커밋 메시지 생성
:: ================================================
if "%~1"=="" (
  for /f "tokens=1-4 delims=:. " %%a in ("%time%") do (
    set hh=%%a
    set mm=%%b
    set ss=%%c
  )
  for /f "tokens=1-3 delims=-/ " %%a in ("%date%") do (
    set yyyy=%%a
    set mm2=%%b
    set dd=%%c
  )
  set "TS=%yyyy%-%mm2%-%dd%_%hh%-%mm%-%ss%"
  set "MSG=chore: deploy - %TS%"
) else (
  set "MSG=%~1"
)

echo ===================================================
echo Deploy script - commit, push current branch, build and deploy to %GH_PAGES_BRANCH%
echo Commit message: %MSG%
echo Repo root: %CD%
echo ===================================================

:: ================================================
:: 현재 브랜치 확인
:: ================================================
for /f "delims=" %%b in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "CUR_BRANCH=%%b"
if "%CUR_BRANCH%"=="" (
  echo Error: not a git repo or git not available.
  exit /b 1
)
echo Current branch: %CUR_BRANCH%

:: ================================================
:: 변경사항 커밋
:: ================================================
git add -A
git commit -m "%MSG%" >nul 2>&1
if %errorlevel% EQU 0 (
  echo Changes committed successfully.
) else (
  echo No new changes to commit or commit skipped.
)

:: ================================================
:: 현재 브랜치 푸시
:: ================================================
echo Pushing %CUR_BRANCH% -> %GH_REMOTE%/%CUR_BRANCH% ...
git push %GH_REMOTE% %CUR_BRANCH%
if %errorlevel% NEQ 0 (
  echo Error: failed to push branch %CUR_BRANCH%.
  exit /b 1
)

:: ================================================
:: 빌드 수행
:: ================================================
if not exist "%SRC_DIR%" (
  echo Error: source dir "%SRC_DIR%" not found.
  exit /b 1
)

pushd "%SRC_DIR%"
echo -----------------------------------------------
echo Running npm ci / npm install and build...
echo -----------------------------------------------

npm ci >nul 2>&1
if %errorlevel% NEQ 0 (
  echo npm ci failed, retrying with npm install...
  npm install >nul 2>&1
  if %errorlevel% NEQ 0 (
    echo npm install failed. Aborting.
    popd
    exit /b 1
  )
)

%BUILD_CMD%
if %errorlevel% NEQ 0 (
  echo Build failed. Aborting.
  popd
  exit /b 1
)
popd

:: ================================================
:: gh-pages 배포
:: ================================================
if not exist "%BUILD_DIR%" (
  echo Error: build output "%BUILD_DIR%" not found.
  exit /b 1
)

echo -----------------------------------------------
echo Deploying build output to %GH_PAGES_BRANCH% branch...
echo -----------------------------------------------
git subtree push --prefix "%BUILD_DIR%" %GH_REMOTE% %GH_PAGES_BRANCH%
if %errorlevel% EQU 0 (
  echo Subtree push succeeded.
  exit /b 0
)

echo Subtree push failed. Trying npx gh-pages fallback...
npx --yes gh-pages -d "%BUILD_DIR%" -b "%GH_PAGES_BRANCH%" -r "%GH_REMOTE%"
if %errorlevel% EQU 0 (
  echo gh-pages publish succeeded.
  exit /b 0
) else (
  echo Both subtree and gh-pages deploy failed. Please check manually.
  exit /b 1
)
