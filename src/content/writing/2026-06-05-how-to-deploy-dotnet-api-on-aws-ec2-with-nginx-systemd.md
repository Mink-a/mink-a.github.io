---
title: How to deploy dotnet api on aws ec2 with nginx + systemd
description: ဤလမ်းညွှန်သည် .NET API တစ်ခုကို Amazon Linux 2023 (EC2) ပေါ်တွင်
  Nginx Reverse Proxy နှင့် systemd တို့ကိုအသုံးပြုပြီး စနစ်တကျ Deploy
  ပြုလုပ်နည်း ဖြစ်ပါသည်။
pubDate: 2026-06-05
draft: false
tags:
  - dotnet
  - deployment
  - ec2
  - nginx
  - linux
---
ဤလမ်းညွှန်သည် .NET API တစ်ခုကို Amazon Linux 2023 (EC2) ပေါ်တွင် Nginx Reverse Proxy နှင့် systemd တို့ကိုအသုံးပြုပြီး စနစ်တကျ Deploy ပြုလုပ်နည်း ဖြစ်ပါသည်။

ဤသည်မှာ အဆင့် ၁ မစတင်မီ သင်၏ Local စက် (နဂိုကွန်ပျူတာ) ပေါ်တွင် API အား စနစ်တကျ တည်ဆောက်၊ စမ်းသပ်ပြီးမှ Production အတွက် ပြင်ဆင်ရန် လိုအပ်သော **Prerequisite Step (အကြိုပြင်ဆင်ရန် အဆင့်)** ဖြစ်ပါသည်။

## ကြိုတင်ပြင်ဆင်ခြင်း အဆင့် — Local Build, Test, and Production Readiness

EC2 ပေါ်သို့ မတင်မီ သင်၏ Local Windows စက်ပေါ်တွင် အောက်ပါအချက်များကို အရင်ဆုံး လုပ်ဆောင်ရန် လိုအပ်သည်။

### ၁။ Build Locally (Local တွင် စမ်းသပ် တည်ဆောက်ခြင်း)

သင်၏ Code များတွင် Syntax Error များနှင့် Compilation Error များ မရှိကြောင်း သေချာစေရန် local တွင် Build အရင်ဆွဲပါ။

- **Visual Studio သုံးလျှင်:** `Ctrl + Shift + B` ကို နှိပ်ပါ။
- **CLI (Git Bash/Terminal) သုံးလျှင်:** Project Folder ထဲတွင် အောက်ပါအတိုင်း ရိုက်ပါ။

```bash
dotnet build

```

### ၂။ Test Locally (Local တွင် Run ၍ စမ်းသပ်ခြင်း)

အပြင်သို့ မတင်မီ မိမိစက်ထဲတွင် API ကို ပတ်ကြည့်ပြီး Swagger သို့မဟုတ် Postman ဖြင့် Endpoint များကို စမ်းသပ်ပါ။

- **Visual Studio သုံးလျှင်:** `F5` သို့မဟုတ် `Ctrl + F5` ကို နှိပ်၍ Run ပါ။
- **CLI သုံးလျှင်:**

```bash
dotnet run

```
- Browser တွင် `http://localhost:<PORT>/swagger` သို့မဟုတ် `http://localhost:<PORT>/weatherforecast` ကို ဝင်ရောက်ပြီး API အလုပ်လုပ်ပုံ မှန်မမှန် စစ်ဆေးပါ။

### ၃။ Prepare for Production (Production အတွက် ပြင်ဆင်ခြင်း)

ယခု API ကို ပတ်ဝန်းကျင်အစစ် (Production environment) တွင် အသုံးပြုတော့မည် ဖြစ်သောကြောင့် အောက်ပါ အခြေခံအချက်များကို သတ်မှတ်ပေးရန် လိုအပ်သည်-

- **Connection Strings & Secrets:** Database Connection String များ သို့မဟုတ် API Key များကို Code ထဲတွင် Hardcode ရေးခဲ့ခြင်းမျိုး ရှိပါက ပြန်ဖျက်ပါ။ ၎င်းတို့ကို `appsettings.Production.json` ထဲတွင် ပြောင်းလဲထည့်သွင်းပါ သို့မဟုတ် EC2 ပေါ်တွင် Environment Variable အဖြစ် သုံးရန် ပြင်ဆင်ပါ။
- **Production Config File:** Project ထဲတွင် `appsettings.Production.json` ရှိမရှိ စစ်ဆေးပါ။ အကယ်၍ မရှိသေးပါက ဖိုင်အသစ်ဆောက်ပြီး Production တွင် သုံးမည့် configuration များကို သီးသန့်ခွဲရေးပါ။

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}

  ```
- **CORS Policy:** အကယ်၍ သင်၏ API ကို Frontend (ဥပမာ Next.js, React) တစ်ခုခုမှ လှမ်းခေါ်မည်ဆိုပါက `Program.cs` ထဲတွင် Production Domain Name ကိုသာ ခွင့်ပြုရန် (CORS Settings တွင်) စနစ်တကျ ပြင်ဆင်ထားပါ။

ဤအဆင့်များ အားလုံး Local တွင် အောင်မြင်စွာ အလုပ်လုပ်ပြီးမှသာ အဆင့် ၁ သို့ ဆက်လက် လုပ်ဆောင်သင့်ပါသည်။



---

## အဆင့် ၁ — EC2 Instance တည်ဆောက်ခြင်းနှင့် .pem File ပြင်ဆင်ခြင်း

၁။ **AWS Console → EC2 → Launch Instance** သို့ သွားပါ။

၂။ အောက်ပါအတိုင်း Configure လုပ်ပါ-

- **Name:** `dotnet-api`
- **AMI:** Amazon Linux 2023 (64-bit x86)
- **Instance type:** `t3.small` (သို့မဟုတ် ထို့ထက်ကြီးသည်ကို ရွေးပါ)
- **Key pair:** Create new → နာမည်ပေးပါ (ဥပမာ `dotnet-api-key`) → `.pem` **file ကို Download လုပ်ပါ**
- **Security Group:** Inbound rules တွင် **SSH (22)**, **HTTP (80)**, **HTTPS (443)** တို့ကို ခွင့်ပြုပေးပါ (Allow လုပ်ပါ)

  ၃။ **Launch Instance** ကို နှိပ်ပါ။

  ၄။ ဒေါင်းလုဒ်လုပ်ထားသော `.pem` ဖိုင်ကို သင်၏ Project Folder ထဲသို့ ရွှေ့ပါ (`.csproj` ဖိုင်ရှိသည့် နေရာနှင့် တစ်ဆင့်တည်း ဖြစ်ရပါမည်)-

```
MyApi/
├── MyApi.csproj
├── dotnet-api-key.pem   ← ဤနေရာတွင် ထားပါ
├── Controllers/
└── ...

```

၅။ `.pem` ဖိုင်အတွက် သင့်တော်သော Permission သတ်မှတ်ရန် သင်၏ local စက်ရှိ **Git Bash** တွင် အောက်ပါ Command ကို ရိုက်ပါ-

```bash
chmod 400 dotnet-api-key.pem

```

## အဆင့် ၂ — Amazon Linux အတွက် App ကို Publish လုပ်ခြင်း

သင်၏ local စက်ရှိ Project Folder ထဲတွင် **Git Bash** ကိုဖွင့်ပြီး အောက်ပါ Command ကို Run ပါ-

```bash
dotnet publish -c Release -r linux-x64 --self-contained false -o ./publish

```

> **ရှင်းလင်းချက်:**
>
> - `-c Release` — Performance ပိုကောင်းအောင် Build လုပ်ပေးသည်။
> - `-r linux-x64` — Amazon Linux (x86_64) အတွက် ရည်ရွယ်သည်။
> - `--self-contained false` — Server ပေါ်တွင် တင်မည့် .NET Runtime ကို သုံးမည်ဖြစ်၍ ဖိုင် Size သေးစေသည်။
> - `-o ./publish` — Publish လုပ်ထားသော ဖိုင်များကို `./publish` Folder ထဲသို့ ထည့်ပေးသည်။

ယခုအခါ သင့် Project Folder ထဲတွင် `publish/` ဆိုသည့် Folder တစ်ခု ရောက်ရှိလာမည် ဖြစ်သည်။

> အကယ်၍ `dotnet publish` command ကို အသုံးပြုရာတွင် အဆင်မပြေပါက သင်၏ Local Windows စက်ရှိ **Visual Studio** မှတစ်ဆင့် အောက်ပါအတိုင်း လက်ဖြင့် Folder Profile ဆောက်၍ Publish လုပ်နိုင်ပါသည်။

## Manual Publish with Virtual Studio

ဤသည်မှာ local စက်ပေါ်တွင် .NET CLI Command အစား Visual Studio ကိုအသုံးပြုပြီး လက်ဖြင့် (Manually) Publish လုပ်လိုပါက အစားထိုးလုပ်ဆောင်ရမည့် အဆင့် ၂ ဖြစ်ပါသည်။

### Visual Studio ဖြင့် လက်ဖြင့် Publish ပြုလုပ်နည်း

1. Visual Studio တွင် သင်၏ Project ကို ဖွင့်ပါ။
2. **Solution Explorer** ရှိ သင်၏ Project Name ပေါ်တွင် **Right-Click** နှိပ်ပြီး **Publish...** ကို ရွေးချယ်ပါ။
3. **Target** နေရာတွင် **Folder** ကို ရွေးပြီး Next နှိပ်ပါ။
4. **Specific Target** တွင်လည်း **Folder** ကို ထပ်မံရွေးချယ်ပြီး Next နှိပ်ပါ။
5. **Location** (ဖိုင်များ ထွက်လာမည့်လမ်းကြောင်း) တွင် မူလအတိုင်း `bin\Release\net8.0\publish\` ထားရှိနိုင်သလို သင်နှစ်သက်ရာ Folder လမ်းကြောင်းကို ရွေးချယ်ပေးပြီး **Finish** ကို နှိပ်ပါ။
6. Profile တည်ဆောက်ပြီးပါက မပြေးမီ **Configuration Settings** ကို ပြင်ဆင်ရန် **"Show all settings"** (သို့မဟုတ် သော့ခလောက် ပုံစံ Setting အိုင်ကွန်) ကို နှိပ်ပါ-
  - **Deployment Mode:** `Framework-dependent` (Server ပေါ်က runtime ကို သုံးရန်)
  - **Target Runtime:** `linux-x64` *(Amazon Linux အတွက် ဤအချက်သည် အရေးကြီးဆုံးဖြစ်သည်)*
7. Settings များကို **Save** လုပ်ပါ။
8. စာမျက်နှာအပေါ်နားရှိ **Publish** ခလုတ် အပြာရောင်ကို နှိပ်ပြီး Build ဆွဲပါ။

Publish လုပ်ငန်းစဉ် ပြီးဆုံးသွားပါက အပေါ်တွင် သတ်မှတ်ခဲ့သည့် Folder လမ်းကြောင်း (ဥပမာ `bin\Release\net8.0\publish\`) ထဲသို့ ဖိုင်များ ရောက်ရှိသွားမည် ဖြစ်သည်။

> **မှတ်ချက် (အဆင့် ၃ အတွက် ပြင်ဆင်ရန်):** > Visual Studio ဖြင့် Publish လုပ်လိုက်သောကြောင့် **အဆင့် ၃**တွင် အသုံးပြုမည့် `scp` command ထဲက local folder လမ်းကြောင်းကို အနည်းငယ် ပြောင်းလဲပေးရပါမည်။
>
> Git Bash ကို Project Folder ၏ အခြေခံ (Root) လမ်းကြောင်းအတိုင်း ဖွင့်ထားဆဲဖြစ်ပါက `scp` command ကို အောက်ပါအတိုင်း ပြောင်းလဲရိုက်ကူးပါ-

```bash
scp -i dotnet-api-key.pem -r ./bin/Release/net8.0/publish/* ec2-user@<PUBLIC_DNS>:/home/ec2-user/dotnet-api/

```

## အဆင့် ၃ — Publish Folder ကို EC2 ပေါ်သို့ ကူးယူခြင်း (Copy)

သင်၏ local Git Bash ထဲတွင် ဆက်လက်ပြီး၊ `<PUBLIC_DNS>` နေရာတွင် သင်၏ EC2 Public DNS (AWS Console → EC2 → Instance details တွင် တွေ့နိုင်သည်၊ ဥပမာ `ec2-xx-xx-xx-xx.compute-1.amazonaws.com`) ဖြင့် အစားထိုး၍ အောက်ပါအတိုင်း ရိုက်ပါ-

```bash
scp -i dotnet-api-key.pem -r ./publish ec2-user@<PUBLIC_DNS>:/home/ec2-user/dotnet-api

```

ဥပမာ နမူနာပြောင်းလဲပုံ-

```bash
scp -i dotnet-api-key.pem -r ./publish ec2-user@ec2-13-215-12-34.compute-1.amazonaws.com:/home/ec2-user/dotnet-api

```

> **မှတ်ချက်:** ဤ Command သည် EC2 Server ပေါ်တွင် `/home/ec2-user/dotnet-api/` ဆိုသည့် Folder ကို တည်ဆောက်ပြီး Publish လုပ်ထားသော ဖိုင်အားလုံးကို လှမ်းထည့်ပေးမည် ဖြစ်သည်။

## အဆင့် ၄ — EC2 ထဲသို့ SSH ဖြင့် ဝင်ခြင်း၊ .NET နှင့် Nginx ထည့်သွင်းခြင်း

### SSH ဖြင့် EC2 သို့ ချိတ်ဆက်ခြင်း

```bash
ssh -i dotnet-api-key.pem ec2-user@<PUBLIC_DNS>

```

### .NET SDK ထည့်သွင်းခြင်း

```bash
sudo dnf update -y
sudo dnf install -y dotnet-sdk-8.0

```

ဗားရှင်း အောင်မြင်စွာ တင်ပြီးကြောင်း စစ်ဆေးရန်-

```bash
dotnet --version
# 8.0.x ဟု ထွက်လာရမည်။

```

### Nginx ထည့်သွင်းခြင်း

```bash
sudo dnf install -y nginx

```

### Nginx ကို Enable လုပ်ပြီး Start လုပ်ခြင်း

```bash
sudo systemctl enable nginx
sudo systemctl start nginx

```

## အဆင့် ၅ — Nginx ကို Public DNS နှင့် Localhost တို့တွင် စမ်းသပ်ခြင်း

### Browser မှတစ်ဆင့် Nginx အလုပ်လုပ်ပုံကို စစ်ဆေးခြင်း

သင်၏ Browser ကိုဖွင့်ပြီး အောက်ပါ Address သို့ သွားပါ-

```
http://<PUBLIC_DNS>

```

Nginx ၏ မူလ **Welcome to nginx!** စာမျက်နှာကို မြင်တွေ့ရမည် ဖြစ်သည်။ မြင်ရပါက Nginx စနစ်တကျ အလုပ်လုပ်နေပြီ ဖြစ်သည်။

### EC2 ထဲမှနေ၍ Localhost ကို တုံ့ပြန်မှုရှိမရှိ စစ်ဆေးခြင်း

```bash
curl http://localhost

```

မျှော်လင့်ထားသည့် Output (Nginx Welcome Page ၏ HTML Code များ မြင်ရမည်)-

```html
<!DOCTYPE html>
<html>
...
<title>Welcome to nginx!</title>
...

```

## အဆင့် ၆ — .dll ကို Run ပြီး Public DNS မှတစ်ဆင့် စမ်းသပ်ခြင်း

### App ကို ယာယီ ကိုယ်တိုင် Run ကြည့်ခြင်း (Foreground တွင် စမ်းသပ်ရန်)

```bash
cd /home/ec2-user/dotnet-api
dotnet MyApi.dll --urls "http://0.0.0.0:5000"

```

`MyApi.dll` *နေရာတွင် သင်၏ တကယ့်* `.csproj` *နာမည်အတိုင်း ထွက်လာသည့်* `.dll` *ဖိုင်နာမည်ကို အစားထိုးပါ။*

မျှော်လင့်ထားသည့် Output-

```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://0.0.0.0:5000
info: Microsoft.Hosting.Lifetime[0]
      Application started.

```

### Browser တွင် စမ်းသပ်ခြင်း

```
http://<PUBLIC_DNS>:5000/swagger
# သို့မဟုတ်
http://<PUBLIC_DNS>:5000/weatherforecast

```

> **သတိပြုရန်:** ဤနေရာတွင် တိုက်ရိုက်စမ်းသပ်နိုင်ရန် ပေါ့တ် **5000** ကို EC2 Security Group တွင် ခေတ္တဖွင့်ပေးထားရပါမည်။ နောက်ပိုင်း Nginx proxy ခံပြီးပါက ၎င်းပေါ့တ်ကို ပြန်ပိတ်နိုင်သည်။ သို့မဟုတ်ပါက နောက်ထပ် SSH Session တစ်ခုထပ်ဖွင့်ပြီး Server ထဲကနေပဲ အောက်ပါအတိုင်း စမ်းသပ်နိုင်သည်-
>
```bash
curl http://localhost:5000/weatherforecast

```

စမ်းသပ်ပြီးပါက App ကို ရပ်တန့်ရန် **Ctrl+C** ကို နှိပ်ပါ။

## အဆင့် ၇ — .NET API အတွက် Nginx Config ရေးဆွဲခြင်း

သင်၏ API အတွက် Nginx Configuration ဖိုင်အသစ်တစ်ခု ဆောက်ပါ-

```bash
sudo nano /etc/nginx/conf.d/dotnet-api.conf

```

အောက်ပါ Code များကို ကူးယူ၍ ထည့်ပါ (Paste လုပ်ပါ)-

```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection keep-alive;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

```

ဖိုင်သိမ်းပြီး ထွက်ရန်: **Ctrl+O → Enter → Ctrl+X**

Config မှန်မမှန် စစ်ဆေးပြီး Nginx ကို Reload လုပ်ပါ-

```bash
sudo nginx -t
# nginx: configuration file /etc/nginx/nginx.conf test is successful ဟု ပြရမည်။

sudo systemctl reload nginx

```

## အဆင့် ၈ — Default ဖြစ်နေသော Nginx server Block ကို ဖျက်ထုတ်ခြင်း

Nginx ၏ မူလ config တွင်ပါဝင်သော `server { listen 80; }` block သည် သင်ယခုဆောက်လိုက်သော config နှင့် ပေါ့တ်ချင်း ငြိစွန်းနေတတ်ပါသည်။ ထို့ကြောင့် ၎င်းကို ဖွင့်ပါ-

```bash
sudo nano /etc/nginx/nginx.conf

```

အောက်ပါအတိုင်း တွေ့ရမည့် Section တစ်ခုလုံးကို ရှာပြီး **ဖျက်ပစ်ပါ** (`server {` မှ အပိတ် `}` အထိ အားလုံးကို ဖျက်ပါ)-

```nginx
# ဤ Block တစ်ခုလုံးကို ဖျက်ပါ ↓
server {
    listen       80;
    listen       [::]:80;
    server_name  _;
    root         /usr/share/nginx/html;

    include /etc/nginx/default.d/*.conf;

    error_page 404 /404.html;
    location = /404.html {
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
    }
}
# ဤ Block တစ်ခုလုံးကို ဖျက်ပါ ↑

```

ဖိုင်သိမ်းပြီး ထွက်ရန်: **Ctrl+O → Enter → Ctrl+X**

ထပ်မံ စစ်ဆေးပြီး Reload လုပ်ပါ-

```bash
sudo nginx -t
sudo systemctl reload nginx

```

ယခုဆိုလျှင် `http://<PUBLIC_DNS>` သို့ ဝင်ရောက်ပါက သင်၏ .NET API ဆီသို့ တိုက်ရိုက် ဦးတည်ပေးမည် ဖြစ်သည် (အဆင့် ၉ တွင် Service ကို Run ပြီးပါက စမ်းသပ်နိုင်သည်)။

## အဆင့် ၉ — systemd Service တည်ဆောက်ခြင်း

API အား နောက်ကွယ်တွင် Background process အဖြစ် အမြဲတမ်းပွင့်နေစေရန်နှင့် Server ကျသွားလျှင်လည်း အလိုအလျောက် ပြန်ပွင့်လာစေရန် (Auto-restart) systemd unit ဖိုင်တစ်ခု ဆောက်ပါမည်-

```bash
sudo nano /etc/systemd/system/dotnet-api.service

```

အောက်ပါစာသားများကို ထည့်ပါ — `MyApi.dll` နေရာတွင် သင်၏ တကယ့် `.dll` နာမည်ကို အစားထိုးရန် မမေ့ပါနှင့်-

```ini
[Unit]
Description=ASP.NET Core API
After=network.target

[Service]
WorkingDirectory=/home/ec2-user/dotnet-api
ExecStart=/usr/bin/dotnet /home/ec2-user/dotnet-api/MyApi.dll --urls "http://0.0.0.0:5000"
Restart=always
RestartSec=10
KillSignal=SIGINT
SyslogIdentifier=dotnet-api
User=ec2-user
Environment=ASPNETCORE_ENVIRONMENT=Production

[Install]
WantedBy=multi-user.target

```

ဖိုင်သိမ်းပြီး ထွက်ရန်: **Ctrl+O → Enter → Ctrl+X**

### Service ကို Enable လုပ်ပြီး Start လုပ်ခြင်း

```bash
sudo systemctl daemon-reload
sudo systemctl enable dotnet-api
sudo systemctl start dotnet-api

```

### စနစ်တကျ ပွင့်နေကြောင်း စစ်ဆေးခြင်း

```bash
sudo systemctl status dotnet-api

```

မျှော်လင့်ထားသည့် Output-

```
● dotnet-api.service - ASP.NET Core API
     Loaded: loaded (/etc/systemd/system/dotnet-api.service; enabled)
     Active: active (running) since ...

```

### End-to-End အားလုံး အလုပ်လုပ်ပုံကို စမ်းသပ်ခြင်း

```bash
# EC2 Server ထဲမှနေ၍ စမ်းသပ်ရန်
curl http://localhost/weatherforecast

# ပြင်ပ Browser မှနေ၍ စမ်းသပ်ရန်
http://<PUBLIC_DNS>/weatherforecast

```

### နောင်တွင် အသုံးလိုမည့် အသုံးဝင်သော Command များ

```bash
# Live တက်လာမည့် Log များကို ကြည့်ရန်
sudo journalctl -u dotnet-api -f

# Code ပြင်ပြီး အသစ်ထပ်တင်တိုင်း Service ကို Restart ချရန်
sudo systemctl restart dotnet-api

# Service ကို ခေတ္တ ပိတ်ထားရန်
sudo systemctl stop dotnet-api

```

### Redeployment (နောက်တစ်ကြိမ် Code အသစ် ပြန်တင်လိုလျှင် လုပ်ဆောင်ရန်)

သင်၏ local စက်ရှိ Project folder ထဲမှ **Git Bash** ကို အသုံးပြုပြီး အောက်ပါ အဆင့် ၃ ဆင့်ဖြင့် အလွယ်တကူ Deploy ပြန်လုပ်နိုင်သည်-

```bash
# ၁။ ဗားရှင်းအသစ်ကို ပြန်ပြီး Publish လုပ်သည်
dotnet publish -c Release -r linux-x64 --self-contained false -o ./publish

# ၂။ ဖိုင်အသစ်များကို EC2 Server ပေါ်သို့ လှမ်းပို့သည်
scp -i dotnet-api-key.pem -r ./publish/* ec2-user@<PUBLIC_DNS>:/home/ec2-user/dotnet-api/

# ၃။ API Service ကို Restart ချပေးသည်
ssh -i dotnet-api-key.pem ec2-user@<PUBLIC_DNS> "sudo systemctl restart dotnet-api"

```

