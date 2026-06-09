---
title: Linux Terminal ကို စတင်လေ့လာသူများအတွက် အခြေခံ Guide
description: ဒီ Guide မှာ Linux Filesystem အခြေခံကနေ စပြီး Developer တစ်ယောက်
  နေ့စဉ်အသုံးများတဲ့ Commands တွေကို လွယ်ကူစွာ နားလည်နိုင်အောင် ရှင်းပြထားပါတယ်။
pubDate: 2026-06-09
draft: false
tags:
  - linux
  - terminal
  - developer essentials
  - dev ops
  - cloud ops
  - server management
lang: my
---
# Linux Terminal ကို စတင်လေ့လာသူများအတွက် အခြေခံ Guide

Software Engineer တစ်ယောက်အနေနဲ့ Linux Terminal ကို ကျွမ်းကျင်ထားဖို့က အရေးကြီးပါတယ်။ Backend Development, Cloud, Docker, Kubernetes, DevOps, Server Management စတဲ့ နယ်ပယ်တွေမှာ Terminal ကို နေ့စဉ်အသုံးပြုရပါတယ်။

ဒီ Guide မှာ Linux Filesystem အခြေခံကနေ စပြီး Developer တစ်ယောက် နေ့စဉ်အသုံးများတဲ့ Commands တွေကို လွယ်ကူစွာ နားလည်နိုင်အောင် ရှင်းပြထားပါတယ်။

---

# 1. Linux Filesystem အခြေခံ

Command တွေ မလေ့လာခင် Path တွေကို အရင်နားလည်ဖို့ လိုပါတယ်။

## .

လက်ရှိ ရောက်နေတဲ့ Folder ကို ကိုယ်စားပြုပါတယ်။

```bash
ls .
# လက်ရှိ Folder ထဲရှိ File နှင့် Directory များကို ပြခြင်း
```

---

## ..

Parent Folder (အပေါ်တစ်ဆင့် Folder) ကို ဆိုလိုပါတယ်။

```bash
cd ..
# လက်ရှိ Folder မှ Parent Folder သို့ ပြန်တက်ခြင်း
```

---

## ~

User ရဲ့ Home Directory ကို ကိုယ်စားပြုပါတယ်။

```bash
cd ~
# Home Directory သို့ ပြန်သွားခြင်း
```

ဥပမာ

```bash
/home/mink
```

---

## /

Linux Filesystem ရဲ့ Root Directory ဖြစ်ပါတယ်။

```bash
cd /
# Filesystem အစ Root Folder သို့ သွားခြင်း
```

---

## *

Wildcard Character ဖြစ်ပါတယ်။

```bash
*.log
# .log ဖြင့်ဆုံးသော File များအားလုံးကို Match လုပ်ခြင်း
```

---

# 2. File နှင့် Directory Navigation

## pwd

လက်ရှိ ဘယ်နေရာမှာ ရောက်နေသလဲ ကြည့်ရန်။

```bash
pwd
# လက်ရှိ Folder Path ကို ပြခြင်း
```

Output

```bash
/home/developer/project
```

---

## ls

Folder ထဲရှိ File များကို ကြည့်ရန်။

```bash
ls
# File နှင့် Folder များကို စာရင်းပြခြင်း
```

```bash
ls -l
# Permission, Owner, Size စသည်တို့ကို အသေးစိတ်ပြခြင်း
```

```bash
ls -la
# Hidden File များပါ ပြသခြင်း
```

---

## cd

Folder ပြောင်းရန်။

```bash
cd src
# src Folder ထဲသို့ ဝင်ခြင်း
```

```bash
cd ../src
# Parent Folder တက်ပြီး src Folder ထဲသို့ ဝင်ခြင်း
```

```bash
cd ~
# Home Directory သို့ သွားခြင်း
```

---

# 3. File Management

## mkdir

Folder အသစ် ဖန်တီးရန်။

```bash
mkdir project
# project Folder အသစ် ဖန်တီးခြင်း
```

```bash
mkdir -p app/v1/controllers
# Nested Folder Structure ကို တစ်ခါတည်း ဖန်တီးခြင်း
```

---

## touch

File အသစ် ဖန်တီးရန်။

```bash
touch index.js
# index.js File အသစ် ဖန်တီးခြင်း
```

---

## cp

File သို့မဟုတ် Folder Copy ကူးရန်။

```bash
cp app.js app-backup.js
# File Copy ကူးခြင်း
```

```bash
cp -R templates config
# Folder တစ်ခုလုံး Copy ကူးခြင်း
```

---

## mv

Rename သို့မဟုတ် Move လုပ်ရန်။

```bash
mv old.txt new.txt
# File Name ပြောင်းခြင်း
```

```bash
mv app.js src/
# File ကို Folder အသစ်သို့ ရွှေ့ခြင်း
```

---

## rm

File သို့မဟုတ် Folder ဖျက်ရန်။

```bash
rm file.txt
# File ဖျက်ခြင်း
```

```bash
rm -r uploads
# Folder နှင့် အတွင်းရှိ File များအား ဖျက်ခြင်း
```

```bash
rm -ri uploads
# ဖျက်မည့် File များကို Confirm မေးပြီး ဖျက်ခြင်း
```

---

# 4. File Content ကြည့်ခြင်း

## cat

File တစ်ခုလုံးကို ကြည့်ရန်။

```bash
cat package.json
# package.json File အကြောင်းအရာအားလုံးကို ပြခြင်း
```

---

## less

File အကြီးများကို Page အလိုက် ဖတ်ရန်။

```bash
less server.log
# Log File များကို အဆင်ပြေစွာ ဖတ်ရှုခြင်း
```

```bash
q
# less မှ ထွက်ခြင်း
```

---

## head

File ရဲ့ အစပိုင်းကို ကြည့်ရန်။

```bash
head package.json
# ပထမဆုံး Lines များကို ပြခြင်း
```

---

## tail

File ရဲ့ နောက်ဆုံးပိုင်းကို ကြည့်ရန်။

```bash
tail error.log
# နောက်ဆုံး Log များကို ကြည့်ခြင်း
```

```bash
tail -n 50 error.log
# နောက်ဆုံး Line 50 ကို ပြခြင်း
```

---

# 5. Search လုပ်ခြင်း

## grep

စာသားရှာရန်။

```bash
grep "TODO" app.js
# TODO ပါသော Line များကို ရှာခြင်း
```

```bash
grep -rn "TODO" ./src
# src Folder အတွင်း TODO များကို Recursive Search လုပ်ခြင်း
```

---

## find

File ရှာရန်။

```bash
find . -name "*.js"
# JavaScript File များကို ရှာခြင်း
```

```bash
find . -name ".env"
# .env File များကို ရှာခြင်း
```

---

# 6. Text Processing

## sed

Text Replace လုပ်ရန်။

```bash
sed 's/localhost/production.db/g' config.env
# localhost ကို production.db ဖြင့် အစားထိုးခြင်း
```

---

## awk

Column Data များ ထုတ်ယူရန်။

```bash
awk '{print $1}' access.log
# ပထမ Column ကို ထုတ်ယူခြင်း
```

```bash
awk '{print $1, $4}' access.log
# Column 1 နှင့် 4 ကို ထုတ်ယူခြင်း
```

---

## cut

CSV Data များ ခွဲထုတ်ရန်။

```bash
cut -d ',' -f 1,3 users.csv
# Column 1 နှင့် 3 ကို ထုတ်ယူခြင်း
```

---

# 7. Process Management

## ps

Running Process များကို ကြည့်ရန်။

```bash
ps aux
# System ပေါ်ရှိ Running Process အားလုံးကို ကြည့်ခြင်း
```

```bash
ps aux | grep node
# Node.js Process များကို ရှာခြင်း
```

---

## htop

System Resource Usage ကို ကြည့်ရန်။

```bash
htop
# CPU, RAM, Process Usage ကို Real-time ကြည့်ခြင်း
```

---

## kill

Process ကို ပိတ်ရန်။

```bash
kill 1234
# PID 1234 Process ကို Stop လုပ်ခြင်း
```

```bash
kill -9 1234
# Process ကို Force Stop လုပ်ခြင်း
```

---

# 8. System Information

## uname

Operating System Information ကြည့်ရန်။

```bash
uname -a
# OS Version နှင့် Kernel Information ကို ကြည့်ခြင်း
```

---

## df

Disk Usage ကြည့်ရန်။

```bash
df -h
# Disk Space အသုံးပြုမှုကို Human Readable Format ဖြင့် ပြခြင်း
```

---

## du

Folder Size ကြည့်ရန်။

```bash
du -sh node_modules
# node_modules Folder ၏ Size ကို ကြည့်ခြင်း
```

---

## free

Memory Usage ကြည့်ရန်။

```bash
free -h
# RAM နှင့် Swap Usage ကို ကြည့်ခြင်း
```

---

## which

Command Install Location ရှာရန်။

```bash
which docker
# Docker Executable ၏ Path ကို ပြခြင်း
```

Output

```bash
/usr/bin/docker
```

---

# 9. Networking Basics

## ping

Connection စစ်ရန်။

```bash
ping google.com
# Google Server သို့ Reachable ဖြစ်မဖြစ် စစ်ခြင်း
```

---

## traceroute

Network Route ကြည့်ရန်။

```bash
traceroute github.com
# GitHub သို့ သွားသော Network Path ကို ကြည့်ခြင်း
```

---

## ip a

IP Address ကြည့်ရန်။

```bash
ip a
# Network Interface နှင့် IP Address များကို ပြခြင်း
```

---

## ss

Open Port များ ကြည့်ရန်။

```bash
ss -tuln
# Listen လုပ်နေသော Port များကို ကြည့်ခြင်း
```

---

# 10. Shell Productivity

## alias

Command Shortcut ပြုလုပ်ရန်။

```bash
alias gs='git status'
# git status အတွက် Shortcut တစ်ခု ဖန်တီးခြင်း
```

---

## set -e

Shell Script Error Handling အတွက်။

```bash
#!/bin/bash
set -e

npm run test
npm run build

# Command တစ်ခု Fail ဖြစ်သည်နှင့် Script ကို ရပ်တန့်စေခြင်း
```

---

## &&

ပထမ Command အောင်မြင်မှ ဒုတိယ Command Run မည်။

```bash
npm run build && npm run deploy
# Build Success ဖြစ်မှ Deploy ဆက်လုပ်ခြင်း
```

---

## ||

ပထမ Command Fail ဖြစ်မှ ဒုတိယ Command Run မည်။

```bash
npm run build || echo "Build Failed"
# Build Fail ဖြစ်ပါက Error Message ပြခြင်း
```

---

# 11. Git အခြေခံ

## Repository Clone

```bash
git clone https://github.com/user/project.git
# Remote Repository ကို Local Machine သို့ Download လုပ်ခြင်း
```

---

## Status စစ်ခြင်း

```bash
git status
# Modified, Deleted, Untracked Files များကို စစ်ဆေးခြင်း
```

---

## Add Changes

```bash
git add .
# ပြောင်းလဲထားသော File များကို Staging Area သို့ ထည့်ခြင်း
```

---

## Commit

```bash
git commit -m "feat: add login page"
# Local Repository တွင် Snapshot တစ်ခုအဖြစ် သိမ်းဆည်းခြင်း
```

---

## Push

```bash
git push origin main
# Local Git Update များကို Remote Repository ၏ main Branch သို့ Push လုပ်ခြင်း
```

---

## Pull

```bash
git pull origin main
# Remote Repository မှ နောက်ဆုံး Update များကို Local သို့ Sync လုပ်ခြင်း
```

---

## History ကြည့်ခြင်း

```bash
git log --oneline --graph
# Commit History ကို Tree ပုံစံဖြင့် ကြည့်ခြင်း
```

---

## Branch ဖန်တီးခြင်း

```bash
git branch feature/auth
# feature/auth Branch အသစ် ဖန်တီးခြင်း
```

---

## Branch ပြောင်းခြင်း

```bash
git checkout feature/auth
# feature/auth Branch သို့ ပြောင်းခြင်း
```

---

## Branch Merge

```bash
git merge feature/auth
# feature/auth Branch မှ Code များကို လက်ရှိ Branch ထဲသို့ ပေါင်းစည်းခြင်း
```

---

# 12. Beginner Developer Workflow

Project အသစ် တစ်ခု စတင်တဲ့အခါ လုပ်လေ့ရှိတဲ့ Workflow တစ်ခု။

```bash
mkdir -p my-project/src my-project/tests
# Project Folder Structure ဖန်တီးခြင်း

cd my-project
# Project Folder ထဲသို့ ဝင်ခြင်း

git init
# Git Repository အသစ် စတင်ခြင်း

touch README.md .gitignore
# Project အတွက် အခြေခံ File များ ဖန်တီးခြင်း

echo "*.log" > .gitignore
# Log File များကို Git Tracking မှ ဖယ်ရှားခြင်း

echo "node_modules/" >> .gitignore
# Dependency Folder ကို Git Tracking မှ ဖယ်ရှားခြင်း

git status
# လက်ရှိ Git State ကို စစ်ဆေးခြင်း

git add .
# File အားလုံးကို Stage လုပ်ခြင်း

git commit -m "Initial project setup"
# ပထမဆုံး Commit ပြုလုပ်ခြင်း
```

ဒီ Guide ထဲက Command တွေကို ကျွမ်းကျင်သွားရင် Linux Server Management, Docker, Cloud Infrastructure, CI/CD, Backend Development နဲ့ DevOps လေ့လာတဲ့အခါ အများကြီး အထောက်အကူ ဖြစ်ပါလိမ့်မယ်။
