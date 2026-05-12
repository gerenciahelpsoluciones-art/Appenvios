/*
 * FocusClip V1 - Monitor de TDAH
 * Proyecto Ingenieria de sistemas  1 semestre EAN
 * 
 * Este código gestiona la lectura del sensor MPU6050, 
 * el control del LED RGB, Buzzer y Vibrador.
 */

#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Wire.h>

// Configuración de Pines
#define PIN_LED_RED   25
#define PIN_LED_GREEN 26
#define PIN_BUZZER    27
#define PIN_VIBRATOR  33

// Umbral de distracción (Ajustar según pruebas)
const float UMBRAL_MOVIMIENTO = 1.5; 
const int TIEMPO_ALERTA = 2000; // 2 segundos de feedback

Adafruit_MPU6050 mpu;

enum Estado { CONCENTRADO, DISTRAIDO };
Estado estadoActual = CONCENTRADO;

unsigned long lastAlertTime = 0;

void setup() {
  Serial.begin(115200);
  
  // Inicialización de Pines
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_VIBRATOR, OUTPUT);

  // Inicialización de Sensor
  if (!mpu.begin()) {
    Serial.println("¡Error! No se encontró el sensor MPU6050");
    while (1) { delay(10); }
  }
  
  Serial.println("FocusClip Iniciado...");
  setEstado(CONCENTRADO);
}

void loop() {
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  // Calcular magnitud de aceleración total (quitando gravedad aprox)
  float magnitud = sqrt(sq(a.acceleration.x) + sq(a.acceleration.y) + sq(a.acceleration.z));
  float variacion = abs(magnitud - 9.8); // 9.8 es la gravedad estándar

  if (variacion > UMBRAL_MOVIMIENTO) {
    if (estadoActual == CONCENTRADO) {
      activarAlerta();
    }
  }

  // Volver a estado concentrado después de un tiempo
  if (estadoActual == DISTRAIDO && (millis() - lastAlertTime > TIEMPO_ALERTA)) {
    setEstado(CONCENTRADO);
  }

  delay(50); // Muestreo cada 50ms
}

void setEstado(Estado nuevoEstado) {
  estadoActual = nuevoEstado;
  if (estadoActual == CONCENTRADO) {
    digitalWrite(PIN_LED_GREEN, HIGH);
    digitalWrite(PIN_LED_RED, LOW);
    digitalWrite(PIN_VIBRATOR, LOW);
    noTone(PIN_BUZZER);
    Serial.println("Estado: CONCENTRADO");
  } else {
    digitalWrite(PIN_LED_GREEN, LOW);
    digitalWrite(PIN_LED_RED, HIGH);
    Serial.println("Estado: DISTRAIDO");
  }
}

void activarAlerta() {
  setEstado(DISTRAIDO);
  lastAlertTime = millis();
  
  // Feedback Físico
  digitalWrite(PIN_VIBRATOR, HIGH);
  tone(PIN_BUZZER, 1000); // Tono de 1kHz
}
