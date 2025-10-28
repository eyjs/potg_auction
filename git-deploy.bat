@echo off
setlocal enabledelayedexpansion

:: ---------------------------
:: 설정 (필요하면 수정)
:: SRC_DIR = 빌드 대상 폴더 (상대 경로)
:: BUILD_DIR = 빌드 결과 폴더 (상대 경로 from repo root)
:: BUILD_CMD = 빌드 명령 (실행은 SRC_DIR에서)
:: ---------------------------
set "SRC_DIR=ClientApp"
set "BUILD_CMD=npm run build"
set "BUILD_DIR=%SRC_DIR%\dist"
set "GH_REMOTE=origin"
set "GH_PAGES_BRANCH=gh-pages"
:: 커밋 메시지: 첫번째 인자 사용, 없으면 timestamp 메시지
if "%~1"=="" (
  for /f "tokens=1-4 delims=:. " %%a in ("%time%") do (
    set hh=%%a
    set mm=%%b
    set ss=%%c
  )
  for /f "tokens=1-3 delims=/- " %%a in ("%date%") do (
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

:: 현재 브랜치 확인
for /f "delims=" %%b in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "CUR_BRANCH=%%b"
if "%CUR_BRANCH%"=="" (
  echo Error: not a git repo or git not available.
  exit /b 1
)
echo Current branch: %CUR_BRANCH%

:: 단계 1: add & commit (무변경시 건너뜀)
git add -A
git commit -m "%MSG%" 2>nul
if %errorlevel% EQU 0 (
  echo Committed changes.
) else (
  echo No changes to commit or commit failed (continuing).
)

:: 단계 2: push current branch to origin
echo Pushing %CUR_BRANCH% -> %GH_REMOTE%/%CUR_BRANCH% ...
git push %GH_REMOTE% %CUR_BRANCH%
if %errorlevel% NEQ 0 (
  echo Error: failed to push branch %CUR_BRANCH%.
  exit /b 1
)

:: 단계 3: build (SRC_DIR)
if not exist "%SRC_DIR%" (
  echo Error: source dir "%SRC_DIR%" not found. Aborting.
  exit /b 1
)

pushd "%SRC_DIR%"
echo Running install and build in %CD%...
:: prefer npm ci in CI, fallback to npm install if it fails
npm ci
if %errorlevel% NEQ 0 (
  echo npm ci failed, trying npm install...
  npm install
  if %errorlevel% NEQ 0 (
    echo npm install failed. Aborting.
    popd
    exit /b 1
  )
)

:: run build
%BUILD_CMD%
if %errorlevel% NEQ 0 (
  echo Build command failed. Aborting.
  popd
  exit /b 1
)
popd

:: 단계 4: gh-pages 배포
if not exist "%BUILD_DIR%" (
  echo Error: build output "%BUILD_DIR%" not found. Aborting.
  exit /b 1
)

echo Attempting git subtree push --prefix %BUILD_DIR% %GH_REMOTE% %GH_PAGES_BRANCH% ...
git subtree push --prefix "%BUILD_DIR%" %GH_REMOTE% %GH_PAGES_BRANCH%
if %errorlevel% EQU 0 (
  echo Subtree push succeeded.
  exit /b 0
)

echo Subtree push failed. Trying npx gh-pages fallback...
:: fallback: npx gh-pages
npx --yes gh-pages -d "%BUILD_DIR%" -b "%GH_PAGES_BRANCH%" -r "https://%GH_REMOTE%/%CD%/.."
:: Note: the above remote URL may not be valid in some environments; try simple npx command:
if %errorlevel% NEQ 0 (
  echo Trying simpler npx gh-pages command (will use origin remote)...
  npx --yes gh-pages -d "%BUILD_DIR%" -b "%GH_PAGES_BRANCH%" -r "%GH_REMOTE%"
)

if %errorlevel% EQU 0 (
  echo gh-pages publish succeeded.
  exit /b 0
) else (
  echo Both subtree and gh-pages deploy failed. Please check manually.
  exit /b 1
)
