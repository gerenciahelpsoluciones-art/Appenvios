/*
 * FocusClip V1 - Monitor de TDAH
 * Proyecto Ingenieria de Sistemas - 1er Semestre EAN
 *
 * Componentes:
 *   - ESP32 DevKit V1
 *   - MPU-6050  → I2C: SDA=GPIO21, SCL=GPIO22
 *   - LED Verde → GPIO 26 (con resistencia 220Ω)
 *   - LED Rojo  → GPIO 25 (con resistencia 220Ω)
 *   - Vibrador  → GPIO 33 (módulo con driver integrado)
 *   - Buzzer    → GPIO 27 (opcional — si no lo tienes, el código igual funciona)
 *
 * Librerías necesarias (instalar en Arduino IDE):
 *   - Adafruit MPU6050
 *   - Adafruit Unified Sensor
 */

#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Wire.h>
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

// Constructor global — corre antes de setup(), desactiva brownout al inicio
struct BrownoutGuard { BrownoutGuard() { WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0); } } _bg;

// ── Pines ─────────────────────────────────────────────────────
#define PIN_LED_RED   25
#define PIN_LED_GREEN 26
#define PIN_BUZZER    27
#define PIN_VIBRATOR  33

// ── Canal PWM para buzzer (ESP32 v3: ledcAttach, no ledcSetup) ──
#define BUZZER_FREQ     1000   // Hz
#define BUZZER_RES      8      // bits de resolución

// ── Parámetros de detección ───────────────────────────────────
const float UMBRAL_MOVIMIENTO = 1.5;  // m/s² sobre la gravedad — bajar si es muy sensible
const int   TIEMPO_ALERTA     = 2000; // ms que dura la alerta antes de volver a verde

Adafruit_MPU6050 mpu;

enum Estado { CONCENTRADO, DISTRAIDO };
Estado estadoActual = CONCENTRADO;
unsigned long lastAlertTime = 0;

// ── Helpers buzzer compatibles con ESP32 ──────────────────────
void buzzerOn(int frecuencia) {
  ledcAttach(PIN_BUZZER, frecuencia, BUZZER_RES);
  ledcWrite(PIN_BUZZER, 128); // 50% duty cycle → volumen medio
}

void buzzerOff() {
  ledcWrite(PIN_BUZZER, 0);
  ledcDetach(PIN_BUZZER);
}

// ─────────────────────────────────────────────────────────────
void setup() {
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0); // deshabilita brownout para prototipos
  Serial.begin(115200);

  pinMode(PIN_LED_RED,   OUTPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_VIBRATOR,  OUTPUT);
  // PIN_BUZZER se gestiona por LEDC, no necesita pinMode

  if (!mpu.begin()) {
    Serial.println("ERROR: No se encontró el MPU-6050. Revisa los cables SDA/SCL.");
    // Parpadea LED rojo para indicar error de hardware
    while (1) {
      digitalWrite(PIN_LED_RED, HIGH); delay(300);
      digitalWrite(PIN_LED_RED, LOW);  delay(300);
    }
  }

  mpu.setAccelerometerRange(MPU6050_RANGE_2_G);
  mpu.setGyroRange(MPU6050_RANGE_250_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

  Serial.println("FocusClip listo ✓");
  setEstado(CONCENTRADO);
}

// ─────────────────────────────────────────────────────────────
void loop() {
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  // Magnitud de aceleración total menos la gravedad estándar (9.8 m/s²)
  float magnitud = sqrt(sq(a.acceleration.x) +
                        sq(a.acceleration.y) +
                        sq(a.acceleration.z));
  float variacion = abs(magnitud - 9.8);

  if (variacion > UMBRAL_MOVIMIENTO && estadoActual == CONCENTRADO) {
    activarAlerta();
  }

  // Volver a CONCENTRADO cuando termina el tiempo de alerta
  if (estadoActual == DISTRAIDO && millis() - lastAlertTime > TIEMPO_ALERTA) {
    setEstado(CONCENTRADO);
  }

  delay(50); // lectura cada 50ms = 20 muestras/segundo
}

// ─────────────────────────────────────────────────────────────
void setEstado(Estado nuevoEstado) {
  estadoActual = nuevoEstado;

  if (estadoActual == CONCENTRADO) {
    digitalWrite(PIN_LED_GREEN, HIGH);
    digitalWrite(PIN_LED_RED,   LOW);
    digitalWrite(PIN_VIBRATOR,  LOW);
    buzzerOff();
    Serial.println("◉ CONCENTRADO");
  } else {
    digitalWrite(PIN_LED_GREEN, LOW);
    digitalWrite(PIN_LED_RED,   HIGH);
    Serial.println("⚠ DISTRAIDO");
  }
}

void activarAlerta() {
  setEstado(DISTRAIDO);
  lastAlertTime = millis();
  digitalWrite(PIN_VIBRATOR, HIGH);
  buzzerOn(BUZZER_FREQ); // sin buzzer conectado no pasa nada
}
