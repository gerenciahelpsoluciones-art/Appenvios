# Guía de Conexiones — FocusClip V2.1
**Componentes confirmados en foto · ESP32 DevKit V1**

---

## Tabla completa de pines

| Componente | Pin del módulo | Pin ESP32 | Cable | Notas |
| :--- | :---: | :---: | :---: | :--- |
| **MPU-6050** | VCC | **3.3V** | Rojo | ⚠️ 3.3V, NO 5V |
| | GND | **GND** | Negro | |
| | SCL | **GPIO 22** | Verde | Reloj I2C |
| | SDA | **GPIO 21** | Azul | Datos I2C |
| **LED Verde** | Ánodo (+) pata larga | **GPIO 26** | — | Con resistencia 220Ω en serie |
| | Cátodo (−) pata corta | **GND** | — | |
| **LED Rojo** | Ánodo (+) pata larga | **GPIO 25** | — | Con resistencia 220Ω en serie |
| | Cátodo (−) pata corta | **GND** | — | |
| **Módulo Vibrador** | IN | **GPIO 33** | — | El módulo ya tiene driver integrado |
| | VCC | **5V** (VIN) | Rojo | |
| | GND | **GND** | Negro | |
| **Buzzer / Parlante** | (+) | **GPIO 27** | — | Con resistencia 100Ω en serie |
| | (−) | **GND** | Negro | |

---

## Diagrama de conexión (vista textual)

```
ESP32 DevKit V1
┌─────────────────────────────────────┐
│  3.3V ──────────────── MPU6050 VCC  │
│  GND  ──────────────── MPU6050 GND  │
│  G22  ──────────────── MPU6050 SCL  │
│  G21  ──────────────── MPU6050 SDA  │
│                                     │
│  G25  ── [220Ω] ── LED ROJO (+)     │
│  G26  ── [220Ω] ── LED VERDE (+)    │
│  GND  ─────────── LEDs (−)          │
│                                     │
│  G27  ── [100Ω] ── BUZZER (+)       │
│  GND  ─────────── BUZZER (−)        │
│                                     │
│  G33  ─────────── VIBRADOR IN       │
│  VIN  ─────────── VIBRADOR VCC      │
│  GND  ─────────── VIBRADOR GND      │
└─────────────────────────────────────┘
```

---

## Notas importantes

> **MPU-6050 → siempre 3.3V**
> Este módulo opera a 3.3V. Si lo conectas a 5V se daña permanentemente.
> Los cables verde (SCL) y azul (SDA) van directos al ESP32 sin resistencias pull-up porque el módulo ya las trae integradas.

> **LEDs → resistencia 220Ω obligatoria**
> Sin resistencia, el GPIO entrega demasiada corriente y puede quemar el pin del ESP32.
> Conecta la resistencia entre el GPIO y el ánodo (+, pata larga) del LED.

> **Buzzer/Parlante → resistencia 100Ω**
> Si tienes un **parlante pasivo** (como el de la foto, con cono), usa 100Ω.
> Si tienes un **buzzer activo** (cilíndrico negro pequeño con etiqueta), conéctalo directo sin resistencia.
> El código ya usa PWM (`ledcWriteTone`) compatible con ambos tipos.

> **Módulo Vibrador → VIN (5V), no 3.3V**
> El motor necesita 5V para vibrar con fuerza. Usa el pin **VIN** del ESP32 que entrega 5V cuando está conectado por USB.
> El pin IN del módulo se conecta a GPIO 33 (señal de control 3.3V — compatible).

---

## Lista de resistencias necesarias

| Cantidad | Valor | Color de bandas | Para |
| :---: | :---: | :--- | :--- |
| 2 | **220 Ω** | Rojo · Rojo · Café · Dorado | LEDs |
| 1 | **100 Ω** | Café · Negro · Café · Dorado | Buzzer/Parlante |

---

## Verificación rápida antes de subir el código

- [ ] MPU-6050 conectado a 3.3V (NO a 5V)
- [ ] Cables SCL=GPIO22 y SDA=GPIO21 correctos
- [ ] Resistencia 220Ω en cada LED
- [ ] Resistencia 100Ω en el buzzer
- [ ] Módulo vibrador conectado a VIN (5V)
- [ ] Librerías instaladas: `Adafruit MPU6050` + `Adafruit Unified Sensor`
- [ ] Placa seleccionada en Arduino IDE: **ESP32 Dev Module**
