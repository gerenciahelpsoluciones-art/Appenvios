// ═══════════════════════════════════════════════════════════════
//  FocusClip V2.1 — Caja de impresión 3D para niños
//  Proyecto Ingeniería de Sistemas - 1er Semestre EAN
//
//  Hardware: ESP32 DevKit V1 + MPU6050 + LEDs + Buzzer + Vibrador
//
//  MONTAJE: cordón o llavero en la orejeta superior
//    → se cuelga del cuello, mochila o ropa del niño
//    → LED en cara frontal: visible al frente del cuerpo
//
//  PARTES (2 piezas + 1 difusor):
//    1. lower_body()     → cuerpo inferior    [PLA Azul]
//    2. upper_lid()      → tapa con orejeta   [PLA Azul]
//    3. front_diffuser() → difusor LED        [PETG Transparente / PLA Blanco]
//
//  HARDWARE:
//    - 4× M3×10mm  (tapa + cuerpo, 4 esquinas)
//    - 1× cordón o llavero  (pasa por la orejeta)
// ═══════════════════════════════════════════════════════════════

$fn = 64;

// ─── Cavidad interna ──────────────────────────────────────────
// ESP32 DevKit V1: 55.9 × 28.5 × 15mm
inner_l = 64;   // largo  (X — paralelo al USB-C)
inner_w = 38;   // profundidad (Y — frente→atrás)
inner_h = 32;   // alto disponible para componentes

wall    = 3.0;
floor_t = 2.5;
cr      = 5;

// ─── División cuerpo / tapa ───────────────────────────────────
body_h = 30;   // 4mm más para que el logo quede sobre la ventana LED
lid_h  = 12;

// ─── Dimensiones externas ─────────────────────────────────────
ext_l = inner_l + wall * 2;   // ≈70mm
ext_w = inner_w + wall * 2;   // ≈44mm

// ─── Ventana LED (cara FRONTAL, Y=0) ─────────────────────────
fw_l  = 46;    // ancho de la ventana (X)
fw_h  = 14;    // alto de la ventana (Z)
fw_r  = 3;     // radio esquinas
fw_z  = 5;     // posición Z: ventana baja, logo queda arriba con espacio
diff_t = 1.5;  // grosor difusor (al ras de la cara frontal)

// ─── Puerto USB-C (cara derecha, X = ext_l) ──────────────────
usb_w = 10.5;
usb_h = 4.5;
usb_z = floor_t + 3.5;

// ─── Tornillos M3 (postes en 4 esquinas) ─────────────────────
sd     = 3.5;   // diámetro agujero paso M3
boss_d = 7.5;
boss_h = 8;
inset  = wall + boss_d / 2;

boss_pos = [
    [inset,         inset        ],
    [ext_l - inset, inset        ],
    [inset,         ext_w - inset],
    [ext_l - inset, ext_w - inset],
];

// ─── Orejeta para cordón / llavero ───────────────────────────
lug_w    = 16;    // ancho de la orejeta (X)
lug_t    = 9;     // grosor de la orejeta (Y)
lug_h    = 14;    // altura sobre la tapa (Z)
hole_d   = 7.0;   // diámetro del agujero (cordón o llavero)
hole_z   = 9;     // altura del agujero dentro de la orejeta

// ════════════════════════════════════════
//  MÓDULOS AUXILIARES
// ════════════════════════════════════════

module rbox(l, w, h, r) {
    hull()
        for (x=[r, l-r]) for (y=[r, w-r])
            translate([x, y, 0]) cylinder(r=r, h=h);
}

module screw_boss(h) {
    difference() {
        cylinder(d=boss_d, h=h);
        translate([0,0,-0.1]) cylinder(d=sd, h=h+0.2);
    }
}

// Ventana LED con esquinas redondeadas (extrusión en Y)
module led_window_cut(depth) {
    hull()
        for (x=[fw_r, fw_l-fw_r]) for (z=[fw_r, fw_h-fw_r])
            translate([x, 0, z])
                rotate([-90,0,0]) cylinder(r=fw_r, h=depth);
}

// Orejeta de cordón: forma de gota / lágrima
// Base ancha sobre la tapa, se estrecha y forma arco con agujero
module cord_lug() {
    difference() {
        union() {
            // Cuerpo principal — forma oval que se estrecha arriba
            hull() {
                // Base ancha (sobre la tapa)
                translate([0, 0, 0])
                    rbox(lug_w, lug_t, 2, lug_t/2 - 0.1);
                // Cabeza redondeada (arriba)
                translate([lug_w/2, lug_t/2, lug_h - lug_t/2])
                    sphere(d=lug_t);
            }
            // Refuerzo en la base (filetes de transición)
            translate([lug_w/2 - 5, 0, 0])
                cube([10, lug_t, 3]);
        }

        // ── Agujero para cordón / llavero ──
        // Horizontal, perpendicular al eje Y (pasa de lado a lado)
        translate([lug_w/2, -0.1, hole_z])
            rotate([-90, 0, 0])
                cylinder(d=hole_d, h=lug_t + 0.2);

        // Chaflán de entrada (facilita pasar el cordón)
        translate([lug_w/2, -0.1, hole_z])
            rotate([-90, 0, 0])
                cylinder(d1=hole_d + 2, d2=hole_d, h=1.5);
        translate([lug_w/2, lug_t - 1.3, hole_z])
            rotate([-90, 0, 0])
                cylinder(d1=hole_d, d2=hole_d + 2, h=1.5);
    }
}

// ════════════════════════════════════════
//  PARTE 1: CUERPO INFERIOR
// ════════════════════════════════════════
module lower_body() {
    difference() {
        rbox(ext_l, ext_w, body_h, cr);

        // Cavidad interior
        translate([wall, wall, floor_t])
            rbox(inner_l, inner_w, body_h, cr-1);

        // ── Ventana LED cara FRONTAL (Y=0) ─────────────────────
        // Agujero pasante a través de toda la pared frontal
        translate([ext_l/2 - fw_l/2, -0.1, fw_z])
            led_window_cut(wall + 0.2);

        // Rebaje difusor: empieza en Y=0 (cara exterior) → difusor al RAS
        // La forma es 0.4mm más grande para encaje a presión suave
        translate([ext_l/2 - fw_l/2 - 0.4, -0.1, fw_z - 0.4])
            led_window_cut(diff_t + 0.3);

        // ── Puerto USB-C (cara derecha, X=ext_l) ───────────────
        translate([ext_l - wall - 0.1,
                   ext_w/2 - usb_w/2,
                   usb_z])
            hull() {
                cube([wall+2, usb_w, usb_h]);
                translate([0, 0.5, 0.5])
                    cube([wall+2, usb_w-1, usb_h-1]);
            }

        // ── Ranuras de ventilación (cara derecha, bajo USB) ─────
        for (i=[0:4])
            translate([ext_l - wall - 0.1,
                       ext_w*0.18 + i * 6.5,
                       floor_t + 2])
                cube([wall+0.2, 2.2, 10]);

        // ── Agujeros tornillos esquinas ─────────────────────────
        for (p=boss_pos)
            translate([p[0], p[1], -0.1])
                cylinder(d=sd, h=floor_t+0.2);

        // ── Ranura ensamble tapa (hembra) ──────────────────────
        translate([wall-0.5, wall-0.5, body_h-1.5])
            rbox(inner_l+1, inner_w+1, 2, cr-1);
    }

    // ── Logo "FocusClip" EN RELIEVE en cara frontal ─────────────
    // Encima de la ventana LED, sobresale 1mm de la superficie
    // (translate Y=-0.9 + extrude 1mm → texto de Y=-0.9 a Y=0.1)
    translate([ext_l/2 - 21, -0.9, fw_z + fw_h + 3])
        rotate([90, 0, 0])
            linear_extrude(height=1.0)
                text("FocusClip",
                     size=6.5,
                     font="Liberation Sans:style=Bold",
                     halign="left",
                     valign="bottom");

    // Postes internos M3
    for (p=boss_pos)
        translate([p[0], p[1], floor_t])
            screw_boss(boss_h);

    // Rieles de apoyo para el ESP32 (evitan contacto directo con piso)
    translate([wall+2, wall+1,            floor_t]) cube([inner_l-4, 2.5, 4]);
    translate([wall+2, wall+inner_w-3.5,  floor_t]) cube([inner_l-4, 2.5, 4]);

    // Pestaña de cierre macho
    translate([wall, wall, body_h-1.5])
        difference() {
            rbox(inner_l, inner_w, 1.6, cr-1);
            translate([1.2, 1.2, -0.1])
                rbox(inner_l-2.4, inner_w-2.4, 2, cr-2);
        }
}

// ════════════════════════════════════════
//  PARTE 2: TAPA SUPERIOR con OREJETA
//
//  La orejeta sale del centro de la tapa.
//  Agujero Ø7mm — pasa cordón fino, cuerda
//  gruesa, llavero de metal o mosquetón.
//
//  Imprime la tapa normal (sin soporte).
//  La orejeta no necesita soporte porque
//  la forma de gota es autoportante.
// ════════════════════════════════════════
module upper_lid() {
    difference() {
        union() {
            // Cuerpo principal de la tapa
            rbox(ext_l, ext_w, lid_h, cr);

            // ── Orejeta de cordón (centro de la tapa) ──────────
            translate([ext_l/2 - lug_w/2,
                       ext_w/2 - lug_t/2,
                       lid_h])
                cord_lug();
        }

        // Cavidad interior tapa
        translate([wall, wall, -0.1])
            rbox(inner_l, inner_w, lid_h - wall + 0.1, cr-1);

        // Ranura ensamble (hembra — recibe pestaña del cuerpo)
        translate([wall-0.5, wall-0.5, -0.1])
            rbox(inner_l+1, inner_w+1, 1.8, cr-0.5);

        // Agujeros tornillos M3 en 4 esquinas
        for (p=boss_pos)
            translate([p[0], p[1], -0.1])
                cylinder(d=sd, h=wall+0.2);

        // Ventanita de estado en la tapa (opcional — visible desde arriba)
        translate([ext_l/2 - 12, ext_w/2 - 5, lid_h - wall])
            rbox(24, 10, wall+0.1, 2.5);
    }
}

// ════════════════════════════════════════
//  PARTE 3: DIFUSOR LED (cara frontal)
//
//  Encaja a presión en el rebaje del lower_body.
//  Imprime en PETG transparente (0% relleno)
//  o PLA blanco para efecto difuso suave.
// ════════════════════════════════════════
module front_diffuser() {
    translate([0, 0, 0])
        led_window_cut(diff_t);
}

// ════════════════════════════════════════
//  VISTA ENSAMBLE
// ════════════════════════════════════════
module assembly_preview() {
    gap = 8;

    // Cuerpo inferior
    color("SteelBlue", 0.9)
        lower_body();

    // Tapa con orejeta
    color("SteelBlue", 0.88)
        translate([0, 0, body_h + gap])
            upper_lid();

    // Difusor LED frontal — al ras de la cara exterior (Y=0)
    color("Cyan", 0.6)
        translate([ext_l/2 - fw_l/2 - 0.4, -0.1, fw_z - 0.4])
            front_diffuser();

    // Cordón de ejemplo (cilindro delgado pasando por la orejeta)
    color("Tomato", 0.85)
        translate([ext_l/2,
                   ext_w/2 + gap,
                   body_h + gap + lid_h + hole_z])
            rotate([90, 0, 0])
                cylinder(d=3, h=ext_w + gap * 2 + 20);

    // Resplandor LED (indica zona iluminada visible al frente)
    color("Cyan", 0.18)
        translate([ext_l/2 - fw_l/2 - 8,
                   -18,
                   fw_z - 4])
            rbox(fw_l + 16, 18, fw_h + 8, 5);
}

// ════════════════════════════════════════
//  ► SELECCIONA QUÉ PIEZA RENDERIZAR
//    F5 = Preview  |  F6 = Render  |  F7 = STL
// ════════════════════════════════════════

assembly_preview();       // Vista completa con cordón

// lower_body();           // STL 1 — Cuerpo inferior
// upper_lid();            // STL 2 — Tapa con orejeta
// front_diffuser();       // STL 3 — Difusor LED frontal
