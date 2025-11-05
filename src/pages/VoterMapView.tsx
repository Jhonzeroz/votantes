import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Loader2, BarChart3, X, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

// Leaflet global
declare global {
  interface Window { L: any; }
}
declare var L: any;

// --- Tipos ---
interface MpioData {
  MUNICIPIO: string;
  DEPARTAMENTO: string;
  TOTAL: number;
}

// --- SOLUCIÓN: Coordenadas con claves en MAYÚSCULAS ---
const municipalityCoordinates: { [key: string]: [number, number] } = {
  // AMAZONAS
  "ZARAGOZA": [-4.2153, -69.9406],
  "EL ENCANTO": [-1.6173, -73.2206],
  "LA PEDRERA": [-1.3253, -69.5792],
  "LA VICTORIA": [-0.9544, -71.0475],
  "MIRITÍ - PARANÁ": [-1.4014, -71.1747],
  "PUERTO ALEGRÍA": [-1.2339, -73.5231],
  "PUERTO ARICA": [-1.8919, -71.1161],
  "PUERTO NARIÑO": [-3.7703, -70.3831],
  "PUERTO SANTANDER": [-3.7417, -67.9231],
  "TARAPACÁ": [-2.8914, -69.7419],

  // ANTIOQUIA
  "ABRIAQUÍ": [6.6301, -76.0639],
  "ABEJORRAL": [5.7893, -75.4278],
  "ACANDÍ": [8.5111, -77.2772],
  "CAÑASGORDAS": [6.7564, -76.0258],
  "CÁCERES": [7.5775, -75.3486],
  "CAICEDO": [6.4053, -75.9825],
  "CALDAS": [6.0911, -75.6344],
  "CAMPAMENTO": [6.9753, -75.2983],
  "CARACOLÍ": [6.4039, -74.7592],
  "CARAMANTA": [5.5506, -75.6431],
  "CAREPA": [7.7575, -76.6539],
  "CAROLINA": [6.7272, -75.2819],
  "CAUCASIA": [7.9847, -75.1983],
  "CHIGORODÓ": [7.6686, -76.6814],
  "CISNEROS": [6.5383, -75.0883],
  "CIUDAD BOLÍVAR": [5.8494, -76.0247],
  "COCORNÁ": [6.0583, -75.1869],
  "CONCEPCIÓN": [6.3947, -75.2575],
  "CONCORDIA": [6.0469, -75.9078],
  "COPACABANA": [6.3486, -75.5081],
  "DABEIBA": [7.0006, -76.2786],
  "DONMATÍAS": [6.4856, -75.3922],
  "EBÉJICO": [6.3269, -75.7678],
  "EL BAGRE": [7.5947, -74.8083],
  "EL CARMEN DE VIBORAL": [6.0825, -75.3358],
  "EL PEÑOL": [6.2244, -75.2217],
  "EL RETIRO": [6.0617, -75.5031],
  "EL SANTUARIO": [6.1375, -75.2633],
  "ENTRERRÍOS": [6.5669, -75.5169],
  "ENVIGADO": [6.1700, -75.5850],
  "FREDONIA": [5.9242, -75.6706],
  "FRONTINO": [6.7728, -76.1325],
  "GÓMEZ PLATA": [6.6819, -75.2211],
  "GRANADA": [6.1433, -75.1850],
  "GUADALUPE": [6.8189, -75.2414],
  "GUARNE": [6.2781, -75.4433],
  "GUATAPÉ": [6.2325, -75.1625],
  "HELICONIA": [6.2300, -75.7339],
  "HISPANIA": [5.7992, -75.9078],
  "ITAGÜÍ": [6.1728, -75.6111],
  "ITUANGO": [7.1722, -75.7644],
  "JARDÍN": [5.5953, -75.8197],
  "JERICÓ": [5.7922, -75.7836],
  "LA CEJA": [6.0311, -75.4311],
  "LA ESTRELLA": [6.1581, -75.6431],
  "LA PINTADA": [5.7478, -75.6072],
  "LA UNIÓN": [5.9747, -75.3581],
  "LIBORINA": [6.6775, -75.8103],
  "MACEO": [6.5511, -74.7875],
  "MARINILLA": [6.1758, -75.3361],
  "MEDELLÍN": [6.2518, -75.5636],
  "MONTEBELLO": [5.9467, -75.5217],
  "MURINDÓ": [6.9844, -76.7547],
  "MUTATÁ": [7.2433, -76.4367],
  "NARIÑO": [5.6103, -75.1769],
  "NECHÍ": [8.0942, -74.7756],
  "NECOCLÍ": [8.4239, -76.7892],
  "OLAYA": [6.6256, -75.8122],
  "PEQUE": [7.0217, -75.9092],
  "PUEBLORRICO": [5.7914, -75.8428],
  "PUERTO BERRÍO": [6.4911, -74.4033],
  "PUERTO NARE": [6.1844, -74.5836],
  "PUERTO TRIUNFO": [5.8706, -74.6400],
  "REMEDIOS": [7.0281, -74.6928],
  "RIONEGRO": [6.1472, -75.3767], 
  "SABANETA": [6.1508, -75.6150],
  "SALGAR": [5.9658, -75.9647],
  "SAN ANDRÉS DE CUERQUIA": [6.9094, -75.6669],
  "SAN CARLOS": [6.1844, -74.9933],
  "SAN FRANCISCO": [5.9658, -75.9647],
  "SAN JERÓNIMO": [6.4392, -75.7289],
  "SAN JOSÉ DE LA MONTAÑA": [6.8497, -75.6803],
  "SAN JUAN DE URABÁ": [8.7619, -76.5308],
  "SAN LUIS": [6.0422, -75.1111],
  "SAN PEDRO DE LOS MILAGROS": [6.4597, -75.5564],
  "SAN PEDRO DE URABÁ": [8.2742, -76.3750],
  "SAN RAFAEL": [6.2961, -75.0203],
  "SAN ROQUE": [6.4828, -74.9597],
  "SANTA BÁRBARA": [5.8786, -75.5678],
  "SANTA FE DE ANTIOQUIA": [6.5564, -75.8286],
  "SANTA ROSA DE OSOS": [6.6431, -75.4581],
  "SANTO DOMINGO": [6.4722, -75.1642],
  "SEGOVIA": [7.0792, -74.6997],
  "SONSÓN": [5.7119, -75.3114],
  "SOPETRÁN": [6.4992, -75.7431],
  "TÁMESIS": [5.6650, -75.7147],
  "TARAZÁ": [7.5844, -75.4000],
  "TARSO": [5.8642, -75.8258],
  "TITIRIBÍ": [6.0658, -75.7936],
  "TOLEDO": [7.0142, -75.6956],
  "TURBO": [8.0983, -76.7333],
  "URAMITA": [6.8994, -76.1742],
  "URRAO": [6.3142, -76.1342],
  "VALDIVIA": [7.2933, -75.4383],
  "VEGACHÍ": [6.7528, -74.7947],
  "VENECIA": [5.9639, -75.7364],
  "VIGÍA DEL FUERTE": [6.5892, -76.8972],
  "YALÍ": [6.6747, -74.8314],
  "YARUMAL": [6.9625, -75.4172],
  "YOLOMBÓ": [6.5978, -75.0072],
  "YONDÓ": [7.0061, -73.9092],


  // ARAUCA
  "ARAUCA": [7.0847, -70.7591],
  "ARAUQUITA": [7.0294, -71.4272],
  "CRAVO NORTE": [6.3033, -70.2067],
  "FORTUL": [6.7917, -71.8125],
  "PUERTO RONDÓN": [6.2806, -71.1006],
  "SARAVENA": [6.9553, -71.8728],
  "TAME": [6.4606, -71.7364],

  // ATLÁNTICO
  "BARRANQUILLA": [10.9639, -74.7963], // Clave corregida a mayúsculas
  "BARANOA": [10.7967, -74.9167],
  "CAMPO DE LA CRUZ": [10.4000, -74.7667],
  "CANDELARIA": [10.4833, -74.8333],
  "GALAPA": [10.8833, -74.8833],
  "JUAN DE ACOSTA": [10.7833, -75.0167],
  "LURUACO": [10.5833, -75.1333],
  "MALAMBO": [10.8667, -74.7667],
  "MANATÍ": [10.4500, -74.9500],
  "PALMAR DE VARELA": [10.7667, -74.7500],
  "PIOJÓ": [10.7000, -75.1333],
  "POLONUEVO": [10.7667, -74.8833],
  "PONEDERA": [10.8333, -74.8000],
  "PUERTO COLOMBIA": [10.9833, -74.9500],
  "REPELÓN": [10.5000, -75.1167],
  "SABANAGRANDE": [10.8000, -74.8167],
  "SABANALARGA": [10.6167, -74.9167],
  "SANTA LUCÍA": [10.3333, -74.9667],
  "SANTO TOMÁS": [10.7667, -74.7500],
  "SOLEDAD": [10.9185, -74.7641],
  "SUAN": [10.3167, -74.9333],
  "TUBARÁ": [10.9833, -74.8833],
  "USIACURÍ": [10.8167, -74.9667],
  "ACHÍ": [9.1333, -74.5333],
  "ALTOS DEL ROSARIO": [9.5000, -74.4500],
  "ARENAL": [9.0833, -74.6667],
  "ARJONA": [10.2833, -75.1167],
  "ARROYOHONDO": [10.2500, -75.1333],
  "BARRANCO DE LOBA": [8.9500, -74.1333],
  "CALAMAR": [10.2167, -74.9500],
  "CANTAGALLO": [7.3833, -74.0167],
  "CARTAGENA": [10.3910, -75.4794],
  "CICUCO": [9.2833, -74.6000],
  "CLEMENCIA": [10.4167, -75.2500],
  "CÓRDOBA": [9.9167, -74.8333],
  "EL CARMEN DE BOLÍVAR": [9.7167, -75.1333],
  "EL GUAMO": [10.2500, -75.0167],
  "EL PEÑÓN": [8.8167, -74.2833],
  "HATILLO DE LOBA": [8.7833, -74.1667],
  "MAGANGUÉ": [9.2500, -74.7500],
  "MAHATES": [10.2333, -75.1833],
  "MARGARITA": [10.2833, -75.0833],
  "MARÍA LA BAJA": [10.0167, -75.3000],
  "MOMPÓS": [9.2333, -74.4167],
  "MONTECRISTO": [8.3667, -74.4167],
  "MORALES": [9.6000, -75.3000],
  "NOROSÍ": [8.4833, -73.9667],
  "PINILLOS": [8.9167, -74.3500],
  "REGIDOR": [8.5500, -74.1333],
  "RÍO VIEJO": [8.6000, -74.0833],
  "SAN CRISTÓBAL": [10.4333, -75.0167],
  "SAN ESTANISLAO": [10.4167, -75.1667],
  "SAN FERNANDO": [9.2333, -74.2833],
  "SAN JACINTO": [10.4333, -75.1167],
  "SAN JACINTO DEL CAUCA": [8.1500, -74.6167],
  "SAN JUAN NEPOMUCENO": [10.0500, -75.1000],
  "SAN MARTÍN DE LOBA": [8.6167, -74.0500],
  "SAN PABLO": [8.9167, -74.2167],
  "SANTA CATALINA": [10.6000, -75.0500],
  "SANTA ROSA": [10.4167, -75.3667],
  "SANTA ROSA DEL SUR": [9.2000, -74.4500],
  "SIMITÍ": [8.1500, -73.9333],
  "SOPLAVIENTO": [10.2833, -75.2167],
  "TALAIGUA NUEVO": [9.2167, -74.6000],
  "TIQUISIO": [8.5833, -74.0167],
  "TURBACO": [10.3333, -75.4167],
  "TURBANÁ": [10.2833, -75.4333],
  "ZAMBRANO": [9.7000, -74.8333],

  // BOYACÁ
  "ALMEIDA": [5.4167, -73.2167],
  "AQUITANIA": [5.5167, -72.9000],
  "ARCABUCO": [5.8167, -73.4167],
  "BELÉN": [5.9833, -73.1833],
  "BERBEO": [5.2833, -73.1167],
  "BETÉITIVA": [6.0167, -72.9167],
  "BOAVITA": [6.4333, -72.7167],
  "BOYACÁ": [5.5667, -73.0833],
  "BUSBANZÁ": [5.9833, -72.9167],
  "CAMPOHERMOSO": [5.1333, -73.2167],
  "CERINZA": [5.9167, -73.0500],
  "CHINAVITA": [5.1167, -73.3667],
  "CHIQUINQUIRÁ": [5.6167, -73.7333],
  "CHÍQUIZA": [5.5500, -73.4167],
  "CHISCAS": [6.4333, -72.2500],
  "CHITA": [6.1833, -72.2500],
  "CHITARAQUE": [6.2667, -73.2500],
  "CHIVATÁ": [5.8667, -73.2167],
  "CIÉNEGA": [5.4667, -73.3667],
  "CÓMBITA": [5.8333, -73.2500],
  "COPER": [5.9667, -73.8000],
  "CORRALES": [5.8333, -72.9167],
  "COVARACHÍA": [6.3667, -72.4167],
  "CUBARÁ": [6.5667, -72.1500],
  "CUCAITA": [5.6167, -73.2500],
  "CUITIVA": [5.4167, -72.9500],
  "DUITAMA": [5.8231, -73.0349],
  "EL COCUY": [6.4167, -72.4667],
  "EL ESPINO": [6.4167, -72.3333],
  "FIRAVITOBA": [5.7167, -73.0833],
  "FLORESTA": [5.8333, -72.9333],
  "GACHANTIVÁ": [5.7667, -73.3167],
  "GÁMEZA": [5.7667, -72.8667],
  "GARAGOA": [5.0667, -73.3667],
  "GUACAMAYAS": [6.1333, -72.4167],
  "GUATEQUE": [5.0000, -73.4667],
  "GUAYATÁ": [4.9833, -73.4167],
  "GUICÁN": [6.4667, -72.3167],
  "IZA": [5.6667, -73.1167],
  "JENESANO": [5.7167, -73.2500],
  "LABRANZAGRANDE": [5.9167, -72.8833],
  "LA CAPILLA": [5.1667, -73.2167],
  "LA UVITA": [6.1167, -72.5167],
  "MACANAL": [5.0333, -73.3000],
  "ARIPI": [5.7167, -73.8833],
  "MIRAFLORES": [5.2000, -73.1333],
  "MONGUA": [6.0167, -72.4667],
  "MONGUÍ": [6.0167, -72.5000],
  "MONIQUIRÁ": [5.8833, -73.6000],
  "MOTAVITA": [5.8167, -73.4000],
  "MUZO": [5.5167, -74.0167],
  "NOBSA": [5.7333, -72.9500],
  "NUEVO COLÓN": [5.6667, -73.3000],
  "OICATÁ": [5.5500, -73.2167],
  "OTANCHE": [5.1167, -74.0167],
  "PACHAVITA": [5.7667, -73.4167],
  "PÁEZ": [5.8333, -73.6167],
  "PAIPA": [5.7833, -73.1167],
  "PAJARITO": [5.2167, -72.6167],
  "PANQUEBA": [6.2500, -72.2833],
  "PAUNA": [5.6833, -73.7500],
  "PAYA": [6.0833, -72.3167],
  "PAZ DE RÍO": [5.7500, -72.9167],
  "PESCA": [5.4667, -73.0167],
  "PISBA": [6.0167, -72.2500],
  "PUERTO BOYACÁ": [5.9833, -74.4000],
  "QUÍPAMA": [5.6500, -74.0167],
  "RAMIRIQUÍ": [5.3833, -73.3167],
  "RÁQUIRA": [5.3667, -73.5167],
  "RONDÓN": [5.2167, -73.2167],
  "SABOYÁ": [5.7167, -73.8167],
  "SÁCHICA": [5.5333, -73.4833],
  "SAMACÁ": [5.4833, -73.4833],
  "SAN EDUARDO": [4.8167, -73.2833],
  "SAN JOSÉ DE PARE": [5.9667, -73.0500],
  "SAN LUIS DE GACENO": [4.9333, -73.1167],
  "SAN MATEO": [5.9667, -73.1167],
  "SAN MIGUEL DE SEMA": [5.8833, -73.4167],
  "SAN PABLO DE BORBUR": [5.7667, -74.1000],
  "SANTA MARÍA": [4.8500, -73.2500],
  "SANTA ROSA DE VITERBO": [5.8667, -73.0167],
  "SANTA SOFÍA": [5.7167, -73.2833],
  "SANTANA": [5.9333, -73.1833],
  "SATIVANORTE": [6.1333, -72.7167],
  "SATIVASUR": [6.0833, -72.7500],
  "SIACHOQUE": [5.5000, -73.3500],
  "SOATÁ": [6.0500, -72.7167],
  "SOCHA": [6.1000, -72.4500],
  "SOCOTÁ": [6.1000, -72.4167],
  "SOGAMOSO": [5.7167, -72.9333],
  "SORA": [5.6667, -73.2833],
  "SORACÁ": [5.6000, -73.2500],
  "SOTAQUIRÁ": [5.7167, -73.3333],
  "SUSACÓN": [6.1000, -72.6833],
  "SUTAMARCHÁN": [5.4667, -73.5500],
  "SUTATENZA": [5.0000, -73.1833],
  "TASCO": [6.1833, -72.6500],
  "TENZA": [4.9167, -73.3500],
  "TIBASOSA": [5.7333, -73.0500],
  "TINJACÁ": [5.6667, -73.3333],
  "TIPACOQUE": [6.4167, -72.7167],
  "TOCA": [5.4667, -73.2167],
  "TOGUÍ": [5.9167, -73.1667],
  "TÓPAGA": [5.7333, -72.7167],
  "TOTA": [5.5500, -72.9167],
  "TUNJA": [5.5353, -73.3678],
  "TUNUNGUÁ": [5.9000, -73.7500],
  "TURMEQUÉ": [5.2500, -73.3833],
  "TUTA": [5.6833, -73.2167],
  "TUTAZÁ": [6.1500, -72.7167],
  "ÚMBITA": [5.4333, -73.1833],
  "VARGAS": [5.5667, -73.2833],
  "VENTAQUEMADA": [5.4667, -73.4167],
  "VIRACACHÁ": [5.5167, -73.2833],
  "ZETAQUIRA": [5.2000, -73.2833],

  "AGUADAS": [5.5667, -75.4667],
  "ANSERMA": [5.2167, -75.7833],
  "ARANZAZU": [5.2667, -75.6000],
  "BELALCÁZAR": [5.0000, -75.8333],
  "CHINCHINÁ": [4.9833, -75.6167],
  "FILADELFIA": [5.3000, -75.5667],
  "LA DORADA": [5.4667, -74.6667],
  "LA MERCED": [5.1667, -75.4167],
  "MANIZALES": [5.0689, -75.5174],
  "MANZANARES": [5.2000, -75.1833],
  "MARMATO": [5.4500, -75.6000],
  "MARQUETALIA": [5.1833, -75.1333],
  "MARULANDA": [5.2500, -75.2500],
  "NEIRA": [5.1667, -75.5000],
  "NORCASIA": [5.6167, -74.9167],
  "PÁCORA": [5.5167, -75.4167],
  "PALESTINA": [5.0167, -75.6500],
  "PENSILVANIA": [5.0333, -75.1167],
  "RIOSUCIO": [5.4167, -75.7000],
  "RISARALDA": [5.2833, -75.7500],
  "SALAMINA": [5.4167, -75.4833],
  "SAMANÁ": [5.3333, -75.0833],
  "SAN JOSÉ": [5.0667, -75.7167],
  "SUPÍA": [5.4167, -75.6333],
  "VICTORIA": [5.5167, -74.8833],
  "VILLAMARÍA": [5.2500, -75.5167],
  "VITERBO": [5.1500, -75.8833],

  // CAQUETÁ
  "BELÉN DE LOS ANDAQUIES": [1.6167, -75.2833],
  "CARTAGENA DEL CHAIRÁ": [1.3833, -75.9667],
  "CURILLO": [1.0500, -75.8500],
  "DONCELLA": [1.2167, -75.6500],
  "EL DONCELLO": [1.5833, -75.2833],
  "EL PAUJIL": [1.6500, -75.2167],
  "FLORENCIA": [1.6142, -75.6063],
  "LA MONTAÑITA": [1.5167, -75.0500],
  "MILÁN": [1.3500, -75.5000],
  "MORELIA": [1.4833, -75.7167],
  "PUERTO RICO": [1.9000, -75.2833],
  "SAN JOSÉ DEL FRAGUA": [1.4833, -75.1667],
  "SAN VICENTE DEL CAGUÁN": [1.8833, -75.1333],
  "SOLANO": [0.7167, -74.8833],
  "SOLITA": [1.1833, -75.7333],
  "VALPARAÍSO": [1.2000, -75.9833],

  // CASANARE
  "AGUAZUL": [5.1833, -72.5333],
  "CHAMEZA": [5.0667, -72.6000],
  "HATO COROZAL": [6.2500, -71.9500],
  "LA SALINA": [5.3333, -72.8833],
  "MANÍ": [4.8167, -72.2833],
  "MONTERREY": [4.8833, -72.9000],
  "NUNCHÍA": [5.6167, -72.4167],
  "OROCUÉ": [4.7833, -71.3333],
  "PAZ DE ARIPORO": [5.5167, -71.7167],
  "PORE": [5.7000, -71.2500],
  "RECETOR": [5.4667, -72.2833],
  "SÁCAMA": [6.0167, -72.2500],
  "SAN LUIS DE PALENQUE": [5.3333, -71.9167],
  "TAURAMENA": [5.0000, -72.7500],
  "TRINIDAD": [5.4167, -71.6500],
  "YOPAL": [5.3327, -72.3959],

  // CAUCA
  "ALMAGUER": [1.9167, -76.8167],
  "ARGELIA": [2.2500, -76.9167],
  "BALBOA": [2.0500, -77.2500],
  "BOLÍVAR": [2.0167, -76.9167],
  "BUENOS AIRES": [2.1500, -76.6167],
  "CAJIBÍO": [2.6333, -76.6167],
  "CALDONO": [2.8167, -76.5167],
  "CALOTO": [3.0000, -76.4833],
  "CORINTO": [3.1667, -76.2667],
  "EL TAMBO": [2.4500, -76.8000],
  "GUACHENÉ": [3.1000, -76.3667],
  "GUAPÍ": [2.5833, -77.8833],
  "INZÁ": [2.5667, -76.0667],
  "JAMBALÓ": [2.4167, -76.6000],
  "LA SIERRA": [2.1500, -76.8667],
  "LÓPEZ DE MICAY": [2.8333, -77.7500],
  "MERCADERES": [1.9167, -77.2500],
  "MIRANDA": [3.2500, -76.2500],
  "PADILLA": [3.1333, -76.3167],
  "PATÍA": [2.1167, -77.0167],
  "PIAMONTE": [1.6500, -76.9500],
  "PIENDAMÓ": [2.7167, -76.6500],
  "POPAYÁN": [2.4448, -76.6147],
  "PUERTO TEJADA": [3.2333, -76.4167],
  "PURACÉ": [2.3333, -76.4167],
  "ROSAS": [2.2167, -76.7500],
  "SAN SEBASTIÁN": [1.9833, -76.7167],
  "SANTANDER DE QUILICHAO": [3.0000, -76.4833],
  "SILVIA": [2.6167, -76.3500],
  "SOTARÁ": [2.4167, -76.3167],
  "SUÁREZ": [3.0500, -76.3000],
  "TIMBÍO": [2.4833, -76.6833],
  "TIMBIQUÍ": [2.7667, -77.7167],
  "TORIBÍO": [2.9500, -76.4833],
  "TOTORÓ": [2.5500, -76.5333],
  "VILLA RICA": [3.0833, -76.3833],

  // CESAR
  "AGUACHICA": [8.3167, -73.6167],
  "AGUSTÍN CODAZZI": [9.8833, -73.7833],
  "ASTREA": [9.5000, -73.9833],
  "BECERRIL": [9.7167, -73.2833],
  "BOSCONIA": [9.9333, -73.8667],
  "CHIMICHAGUA": [9.2500, -73.8167],
  "CHIRIGUANÁ": [9.2333, -73.6000],
  "CURUMANÍ": [9.2167, -73.8333],
  "EL COPEY": [9.7333, -73.9833],
  "EL PASO": [10.0833, -73.2833],
  "GAMARRA": [8.4167, -73.7500],
  "GONZÁLEZ": [8.3833, -73.4000],
  "LA GLORIA": [8.6000, -73.5833],
  "LA JAGUA DE IBIRICO": [9.3333, -73.3333],
  "PAILITAS": [8.9500, -73.6500],
  "PELAYA": [8.6833, -73.6500],
  "PUEBLO BELLO": [10.4333, -73.6167],
  "RÍO DE ORO": [8.5333, -73.4167],
  "SAN ALBERTO": [7.9833, -73.4167],
  "SAN DIEGO": [10.3333, -73.6833],
  "SAN MARTÍN": [8.0000, -73.2500],
  "TALAMALQUE": [8.8833, -73.8333],
  "VALLEDUPAR": [10.4631, -73.2532],

  // CHOCÓ
  "ALTO BAUDÓ": [5.0500, -77.0500],
  "ATRATO": [5.6667, -76.8167],
  "BAGADÓ": [5.4167, -76.6833],
  "BAHÍA SOLANO": [6.2167, -77.4167],
  "BAJO BAUDÓ": [4.7500, -77.1500],
  "BOJAYÁ": [6.0000, -77.0333],
  "CARMEN DEL DARIÉN": [5.0000, -76.9167],
  "CÉRTEGUI": [5.4667, -76.6167],
  "CONDOTO": [5.6333, -76.6500],
  "EL CANTÓN DEL SAN PABLO": [4.9333, -76.9833],
  "EL CARMEN DE ATRATO": [5.4667, -76.7167],
  "EL LITORAL DEL SAN JUAN": [4.9167, -77.3167],
  "ISTMINA": [5.1333, -76.6833],
  "JURADÓ": [7.0167, -77.4833],
  "LLORÓ": [5.4833, -76.5333],
  "MEDIO ATRATO": [5.8667, -76.7167],
  "MEDIO BAUDÓ": [4.9167, -77.1000],
  "MEDIO SAN JUAN": [4.9833, -77.2333],
  "NOVITA": [5.4167, -76.5500],
  "NUQUÍ": [5.7167, -77.2833],
  "QUIBDÓ": [5.6947, -76.6580],
  "RÍO IRÓ": [5.3833, -76.8167],
  "RÍO QUITO": [5.2500, -76.9167],
  "RÍO SUCIO": [5.8333, -76.6667],
  "SAN JOSÉ DEL PALMAR": [5.1000, -76.7167],
  "SIPI": [5.2500, -76.6167],
  "TADÓ": [5.5667, -76.7167],
  "UNGUÍA": [7.9167, -77.5167],
  "UNIÓN PANAMERICANA": [5.1167, -76.9167],

  // CÓRDOBA
  "AYAPEL": [8.3167, -75.1333],
  "BUENAVISTA": [8.7167, -75.5167],
  "CANALETE": [9.2333, -75.8167],
  "CERETÉ": [8.8833, -75.8333],
  "CHIMÁ": [9.0500, -75.7000],
  "CHINÚ": [8.9167, -75.4000],
  "CIÉNAGA DE ORO": [8.8833, -75.6167],
  "COTORRA": [8.6167, -75.7167],
  "LA APARTADA": [8.5833, -75.4167],
  "LORICA": [9.2333, -75.8167],
  "LOS CÓRDOBAS": [8.9333, -75.9833],
  "MOMIL": [9.2167, -75.6833],
  "MONTERÍA": [8.7479, -75.8815],
  "MOÑITOS": [9.2333, -76.2167],
  "MONTELÍBANO": [7.9833, -75.4167],
  "PLANETA RICA": [8.6500, -75.6167],
  "PUEBLO NUEVO": [8.4833, -75.2833],
  "PUERTO ESCONDIDO": [9.0000, -76.2500],
  "PUERTO LIBERTADOR": [7.9167, -75.6833],
  "PURÍSIMA": [8.9500, -75.7333],
  "SAHAGÚN": [8.9500, -75.5167],
  "SAN ANDRÉS DE SOTAVENTO": [9.2167, -75.3000],
  "SAN ANTERO": [9.3667, -75.7667],
  "SAN BERNARDO DEL VIENTO": [9.3333, -75.9500],
  "SAN JOSÉ DE URÉ": [8.0167, -75.8167],
  "SAN PELAYO": [8.9667, -75.8333],
  "TIERRALTA": [8.1667, -76.0500],
  "TUCHÍN": [8.8333, -75.4167],
  "VALENCIA": [8.2500, -75.9167],

  // CUNDINAMARCA
  "AGUA DE DIOS": [4.5167, -74.7833],
  "ALBÁN": [4.8833, -74.4667],
  "ANAPOIMA": [4.5333, -74.5333],
  "ANOLAIMA": [4.8500, -74.4667],
  "APULO": [4.5167, -74.6000],
  "ARBELÁEZ": [4.5167, -74.4167],
  "BELTRÁN": [4.8333, -74.7167],
  "BITUIMA": [5.0167, -74.5500],
  "BOJACÁ": [4.7500, -74.3167],
  "CABRERA": [4.4167, -74.4500],
  "CACHIPAY": [4.9167, -74.4667],
  "CAJICÁ": [4.9167, -74.0167],
  "CAPARRAPÍ": [5.1833, -74.5500],
  "CÁQUEZA": [4.4167, -73.9167],
  "CARMEN DE CARUPÁ": [5.3500, -73.8500],
  "CHAGUANÍ": [5.1167, -74.6500],
  "CHÍA": [4.8667, -74.0500],
  "CHIPAQUE": [4.4833, -74.0167],
  "CHOACHÍ": [4.5167, -73.9833],
  "CHOCONTÁ": [5.1500, -73.6833],
  "COGUA": [5.1333, -73.8167],
  "COTA": [4.8167, -74.0833],
  "CUCUNUBÁ": [5.2833, -73.7500],
  "EL COLEGIO": [4.8833, -74.4167],
  "EL ROSAL": [4.8667, -74.2167],
  "FACATATIVÁ": [4.8167, -74.3667],
  "FÓMEQUE": [4.4833, -73.9333],
  "FOSCA": [4.4500, -74.0500],
  "FUNZA": [4.8167, -74.2000],
  "FÚQUENE": [5.4667, -73.7333],
  "GACHALÁ": [4.8333, -73.5500],
  "GACHANCIPÁ": [5.0167, -73.9000],
  "GACHETÁ": [5.3500, -73.6167],
  "GAMA": [5.1500, -73.6500],
  "GIRARDOT": [4.3053, -74.7025],
  "GUACHETÁ": [5.3167, -73.7167],
  "GUADUAS": [5.0667, -74.6000],
  "GUASCA": [4.8833, -73.8500],
  "GUATAQUÍ": [4.5500, -74.6500],
  "GUATAVITA": [4.9333, -73.8333],
  "GUAYABAL DE SÍQUIMA": [4.9167, -74.4167],
  "GUAYABETAL": [4.3500, -73.8500],
  "GUTIÉRREZ": [4.3167, -73.8000],
  "JERUSALÉN": [4.9500, -74.6833],
  "JUNÍN": [4.7833, -73.6500],
  "LA CALERA": [4.7500, -74.0500],
  "LA MESA": [4.6167, -74.4333],
  "LA PALMA": [5.1833, -74.3833],
  "LA PEÑA": [5.2167, -74.2500],
  "LA VEGA": [5.0167, -74.3500],
  "LENGUAZAQUE": [5.1833, -73.7500],
  "MACHETÁ": [5.0167, -73.6167],
  "MADRID": [4.7333, -74.2667],
  "MANTA": [5.0167, -74.2500],
  "MEDINA": [4.5167, -73.3500],
  "MOSQUERA": [4.7000, -74.2167],
  "NEMOCÓN": [5.0667, -73.8333],
  "NILO": [4.5500, -74.6000],
  "NIMAIMA": [5.1500, -74.3500],
  "NOCAIMA": [5.0833, -74.3500],
  "PACHO": [5.1500, -74.1500],
  "PAIME": [5.2167, -74.3833],
  "PANDI": [4.2500, -74.5167],
  "PARATEBUENO": [4.3833, -73.2500],
  "PASCA": [4.2833, -74.3000],
  "PUERTO SALGAR": [5.4167, -74.6167],
  "PULÍ": [4.3167, -74.6167],
  "QUEBRADANEGRA": [5.0833, -74.3500],
  "QUETAME": [4.3167, -73.8500],
  "QUIPILE": [4.7500, -74.5500],
  "RICAURTE": [4.3500, -74.7000],
  "SAN ANTONIO DEL TEQUENDAMA": [4.6833, -74.3667],
  "SAN BERNARDO": [4.2500, -74.3000],
  "SAN CAYETANO": [5.2833, -74.0500],
  "SAN FRANCISCO DE SALES": [4.8167, -74.4167],
  "SAN JUAN DE RIOSECO": [5.0833, -74.4167],
  "SASAIMA": [5.0167, -74.4167],
  "SESQUILÉ": [4.9833, -73.7833],
  "SIBATÉ": [4.5167, -74.2167],
  "SILVANIA": [4.4167, -74.3667],
  "SIMIJACA": [5.5167, -73.8500],
  "SOACHA": [4.5928, -74.2161],
  "SOPÓ": [4.9167, -73.9667],
  "SUBACHOQUE": [5.0167, -74.1500],
  "SUESCA": [5.0167, -73.7500],
  "SUPATÁ": [5.0500, -74.2500],
  "SUSA": [5.2333, -73.8167],
  "SUTATAUSA": [5.2167, -73.7500],
  "TABIO": [4.9167, -74.0500],
  "TAUSA": [5.2167, -73.7833],
  "TENA": [4.9167, -74.3667],
  "TENJO": [4.9167, -74.1333],
  "TIBACUY": [4.3500, -74.5167],
  "TIBIRITA": [4.9667, -73.6167],
  "TOCAIMA": [4.4167, -74.6333],
  "TOCANCIPÁ": [4.9667, -73.9167],
  "TOPAIPÍ": [5.1500, -74.2500],
  "UBALÁ": [4.8667, -73.4500],
  "UBAQUE": [4.4833, -73.9333],
  "UNE": [4.5000, -73.9167],
  "ÚTICA": [5.1833, -74.7167],
  "VERGARA": [5.0500, -74.2500],
  "VIANÍ": [5.0167, -74.4167],
  "VILLAPINZÓN": [5.2167, -73.6167],
  "VILLETA": [5.0167, -74.2167],
  "VIOTA": [4.5500, -74.4333],
  "YACOPÍ": [5.3833, -73.9167],
  "ZIPACÓN": [4.7167, -74.4167],
  "ZIPAQUIRÁ": [5.0185, -74.0046],

  // GUAINÍA
  "INÍRIDA": [3.8681, -67.9266],
  "BARRANCO MINAS": [2.9167, -68.7333],
  "CACAHUAL": [2.7319, -68.0806],
  "LA GUADALUPE": [2.5833, -68.7333],
  "MAPIRIPANA": [3.0667, -68.2167],
  "MORICHAL": [2.9167, -68.5833],
  "PANA PANA": [2.9333, -68.5667],
  "PACOA": [1.7333, -68.9167],
  "SAN FELIPE": [2.9500, -68.6667],
  "VICTORINO": [2.8833, -68.7833],

  // GUAVIARE
  "EL RETORNO": [2.5333, -72.4167],

  // HUILA
  "ACEVEDO": [1.8167, -76.1667],
  "AGRADO": [2.1667, -75.7333],
  "AIPE": [2.8833, -75.6833],
  "ALGECIRAS": [2.5167, -75.3000],
  "ALTAMIRA": [2.0167, -75.9333],
  "BARAYA": [2.3833, -75.5000],
  "CAMPOALEGRE": [2.3833, -75.3667],
  "COLOMBIA": [2.5500, -75.7000],
  "EL AGRADO": [2.1333, -75.7167],
  "ELÍAS": [2.1056, -75.7569],
  "GARZÓN": [2.2000, -75.6500],
  "GIGANTE": [2.5167, -75.7333],
  "HOBO": [2.5500, -75.4333],
  "IQUIRA": [2.6833, -75.6667],
  "ISNOS": [1.8833, -76.2167],
  "LA ARGENTINA": [2.0500, -76.2500],
  "LA PLATA": [2.4000, -76.2500],
  "NATAGA": [2.2167, -75.7833],
  "NEIVA": [2.9273, -75.2819],
  "OPORAPA": [2.0167, -76.1333],
  "PAICOL": [2.2500, -75.8833],
  "PALERMO": [2.8833, -75.4333],
  "PITAL": [2.8500, -75.5667],
  "PITALITO": [1.8500, -76.0333],
  "RIVERA": [2.0167, -75.4167],
  "SALADOBLANCO": [2.0333, -76.0667],
  "SAN AGUSTÍN": [1.8833, -76.2833],
  "SUAZA": [2.0500, -76.1333],
  "TARQUÍ": [2.2667, -75.7500],
  "TELLO": [2.9167, -75.4667],
  "TERUEL": [2.7500, -75.5167],
  "TESALIA": [2.1167, -75.7833],
  "TIMANÁ": [2.2833, -75.9667],
  "VILLAVIEJA": [3.2333, -75.2333],
  "YAGUARÁ": [2.6333, -75.5167],

  // LA GUAJIRA
  "ALBANIA": [11.7500, -72.6500],
  "BARRANCAS": [11.0000, -72.7667],
  "DIBULLA": [11.2667, -73.3000],
  "DISTRACCIÓN": [10.9333, -72.8500],
  "EL MOLINO": [10.6333, -72.9167],
  "FONSECA": [10.4667, -73.0500],
  "HATONUEVO": [11.5667, -72.2500],
  "MAICAO": [11.3833, -72.2333],
  "MANAURE": [11.7833, -72.4500],
  "RIOHACHA": [11.5444, -72.9072],
  "SAN JUAN DEL CESAR": [10.7667, -73.0000],
  "URIBIA": [11.7167, -72.1833],
  "URUMITA": [10.5667, -72.9667],
  "VILLANUEVA": [10.6000, -73.0333],

  // MAGDALENA
  "ALGARROBO": [10.2500, -74.1167],
  "ARACATACA": [10.5833, -74.1833],
  "ARIGUANÍ": [10.2167, -74.0833],
  "CERRO DE SAN ANTONIO": [10.4333, -74.6333],
  "CHIVOLO": [10.1000, -74.6000],
  "CIÉNAGA": [11.0083, -74.2500],
  "EL BANCO": [9.0000, -73.9833],
  "EL PIÑÓN": [10.3500, -74.7833],
  "EL RETÉN": [10.4333, -74.2500],
  "FUNDACIÓN": [10.5167, -74.1833],
  "GUAMAL": [9.1500, -74.2333],
  "NUEVA GRANADA": [10.2500, -74.3333],
  "PEDRAZA": [10.3500, -74.2500],
  "PIJIÑO DEL CARMEN": [10.2000, -74.6833],
  "PIVIJAY": [10.4667, -74.6167], // Clave corregida a mayúsculas
  "PLATO": [9.7833, -74.7833],
  "PUEBLOVIEJO": [10.4667, -74.4667],
  "REMOLINO": [10.6333, -74.5667],
  "SABANAS DE SAN ÁNGEL": [10.2167, -74.1500],
  "SAN SEBASTIÁN DE BUENAVISTA": [10.3833, -74.2833],
  "SAN ZENÓN": [9.7500, -74.5500],
  "SANTA ANA": [10.3500, -74.7500],
  "SANTA BÁRBARA DE PINTO": [9.3167, -74.1833],
  "SANTA MARTA": [11.2408, -74.1990],
  "SITIONUEVO": [10.8500, -74.7667],
  "TENERIFE": [9.4167, -74.2167],
  "ZAPAYÁN": [10.0833, -74.7333],
  "ZONA BANANERA": [10.7000, -74.1667],

  // META
  "ACACÍAS": [4.3833, -73.7500],
  "BARRANCA DE UPÍA": [4.3333, -72.7333],
  "CABUYARO": [3.8500, -72.6667],
  "CASTILLA LA NUEVA": [3.9500, -73.7000],
  "CUBARRAL": [3.9833, -73.5000],
  "CUMARAL": [4.4833, -73.5167],
  "EL CALVARIO": [4.4000, -72.4833],
  "EL CASTILLO": [3.9500, -73.6833],
  "EL DORADO": [4.7833, -71.3500],
  "FUENTE DE ORO": [3.5000, -73.6833],
  "LA MACARENA": [2.1833, -73.7833],
  "LEJANÍAS": [3.8667, -73.6833],
  "MAPIRIPÁN": [3.4833, -72.3833],
  "MESETAS": [3.3667, -73.9667],
  "PUERTO CONCORDIA": [2.5167, -72.5167],
  "PUERTO GAITÁN": [4.3167, -71.9833],
  "PUERTO LÓPEZ": [4.0833, -72.9667],
  "PUERTO LLERAS": [3.2000, -73.3833],
  "RESTREPO": [4.2667, -73.5667],
  "SAN CARLOS DE GUAROA": [4.0000, -73.1500],
  "SAN JUAN DE ARAMA": [3.1167, -73.6000],
  "SAN JUANITO": [4.4167, -73.6833],
  "URIBE": [3.8500, -73.3500],
  "VILLAVICENCIO": [4.1500, -73.6333],
  "VISTAHERMOSA": [3.8167, -73.7333],

  // NARIÑO
  "ALDANA": [0.9500, -77.6667],
  "ANCUYÁ": [1.0667, -77.6167],
  "ARBOLEDA": [1.4500, -77.3000],
  "BARBACOAS": [1.6833, -78.1500],
  "BUESACO": [1.3667, -77.0167],
  "CHACHAGUÍ": [1.2833, -77.4333],
  "COLÓN": [1.2167, -77.2833],
  "CONSACÁ": [1.3333, -77.4167],
  "CONTADERO": [0.8333, -77.6333],
  "CUASPUD": [0.8833, -77.8333],
  "CUMBAL": [0.9500, -77.7167],
  "CUMBITARA": [1.5167, -77.4833],
  "EL CHARCO": [1.5167, -78.7667],
  "EL ROSARIO": [1.2333, -77.3500],
  "EL TABLÓN DE GÓMEZ": [1.2167, -77.1167],
  "FRANCISCO PIZARRO": [1.9333, -78.9500],
  "FUNES": [0.9167, -77.6500],
  "GUACHUCAL": [0.8833, -77.9167],
  "GUAITARILLA": [1.2833, -77.4333],
  "GUALMATÁN": [0.9667, -77.7500],
  "ILES": [0.9167, -77.6833],
  "IMUÉS": [1.0167, -77.6833],
  "IPALES": [0.8333, -77.6333],
  "LA CRUZ": [0.9833, -77.7167],
  "LA FLORIDA": [1.3333, -77.4167],
  "LA LLANADA": [0.9333, -77.6167],
  "LA TOLA": [1.7833, -78.8000],
  "LEIVA": [1.3167, -77.2833],
  "LINARES": [1.2167, -77.5000],
  "LOS ANDES": [1.3500, -77.6667],
  "MAGÜÍ": [1.5667, -78.7167],
  "MALLAMA": [1.0833, -77.7000],
  "OLAYA HERRERA": [1.5333, -78.7333],
  "OSPINA": [1.0167, -77.4333],
  "PASTO": [1.2136, -77.2817],
  "POLICARPO": [1.2167, -77.5000],
  "POTOSÍ": [0.8167, -77.6167],
  "PROVIDENCIA": [1.1833, -77.4833],
  "PUERRES": [0.8667, -77.5167],
  "PUPIALES": [0.9167, -77.6333],
  "ROBERTO PAYÁN": [1.5833, -78.8833],
  "SAMANIEGO": [1.3500, -77.5333],
  "SAN JOSÉ DE ALBÁN": [1.3333, -77.5000],
  "SAN LORENZO": [1.8500, -78.4667],
  "SAN PEDRO DE CARTAGO": [1.4167, -77.2500],
  "SANDONÁ": [1.3333, -77.5167],
  "SANTACRUZ": [1.4167, -77.2500],
  "SAPUYES": [0.9667, -77.5333],
  "TAMINANGO": [1.3333, -77.4167],
  "TANGUA": [1.2167, -77.4167],
  "TÚQUERRES": [0.9833, -77.7500],
  "YACUANQUER": [0.9500, -77.5167],

  // NORTE DE SANTANDER
  "ÁBREGO": [7.9333, -72.7167],
  "ARBOLEDAS": [7.6167, -72.5500],
  "BOCHALEMA": [7.6000, -72.5000],
  "BUCARASICA": [7.9167, -72.6000],
  "CÁCHIRA": [7.9167, -72.5833],
  "CHINÁCOTA": [7.5500, -72.6167],
  "CHITAGÁ": [7.6333, -72.4667],
  "CONVENCIÓN": [8.2500, -73.2500],
  "CÚCUTA": [7.8939, -72.5078],
  "DURANIA": [7.9167, -72.5167],
  "EL CARMEN": [7.9167, -72.5000],
  "EL TARRA": [8.2500, -73.2500],
  "EL ZULIA": [7.9167, -72.5833],
  "GRAMALOTE": [7.9167, -72.7500],
  "HACARÍ": [8.2500, -73.2500],
  "HERRÁN": [7.4333, -72.4167],
  "LA ESPERANZA": [7.9167, -72.5000],
  "LA PLAYA": [7.9167, -72.5000],
  "LOS PATIOS": [7.8500, -72.5000],
  "LOURDES": [7.9167, -72.5000],
  "MUTISCUA": [7.2500, -72.5000],
  "OCAÑA": [8.2333, -73.3500],
  "PAMPLONA": [7.3833, -72.6500],
  "PAMPLONITA": [7.4167, -72.6500],
  "RAGONVALIA": [7.4167, -72.6500],
  "SALAZAR": [7.4167, -72.6500],
  "SAN CALIXTO": [7.4167, -72.6500],
  "SANTIAGO": [7.8500, -72.5000],
  "SARDINATA": [7.9167, -72.6667],
  "SILOS": [7.9167, -72.5000],
  "TEORAMA": [7.9167, -73.2500],
  "TIBÚ": [8.6500, -72.7333],
  "VILLA CARO": [7.9167, -72.7500],
  "VILLA DEL ROSARIO": [7.8500, -72.4667],

  // PUTUMAYO
  "MOCOA": [1.4939, -76.6458],
  "ORITO": [0.7167, -76.9167],
  "PUERTO ASÍS": [0.5167, -76.5000],
  "PUERTO CAICEDO": [0.8833, -76.5000],
  "PUERTO GUZMÁN": [1.2000, -75.3500],
  "PUERTO LEGUÍZAMO": [0.2167, -74.7667],
  "SAN MIGUEL": [0.8500, -76.8833],
  "SIBUNDOY": [1.1833, -76.9333],
  "VALLE DEL GUAMUEZ": [0.3333, -76.6833],
  "VILLAGARZÓN": [1.0833, -76.6500],

  // QUINDÍO
  "ARMENIA": [4.5333, -75.6833],
  "CALARCÁ": [4.5167, -75.6500],
  "CIRCASIA": [4.6167, -75.6333],
  "FILANDIA": [4.6833, -75.6667],
  "GÉNOVA": [4.2833, -75.7500],
  "LA TEBIDA": [4.4167, -75.8000],
  "MONTENEGRO": [4.5667, -75.7500],
  "PIJAO": [4.3333, -75.7167],
  "QUIMBAYA": [4.6333, -75.7667],
  "SALENTO": [4.6333, -75.5667],

  // RISARALDA
  "APIA": [5.0833, -75.9167],
  "BELÉN DE UMBRÍA": [5.0000, -75.8833],
  "DOSQUEBRADAS": [4.8333, -75.8167],
  "GUÁTICA": [5.3000, -75.7500],
  "LA CELIA": [4.9833, -75.8333],
  "LA VIRGINIA": [4.9000, -75.8833],
  "MARSELLA": [4.9333, -75.7500],
  "MISTRATÓ": [5.2500, -75.8833],
  "PEREIRA": [4.8133, -75.6961],
  "PUEBLO RICO": [5.2167, -76.1167],
  "QUINCHÍA": [5.3167, -75.7333],
  "SANTA ROSA DE CABAL": [4.8667, -75.6167],
  "SANTUARIO": [5.0500, -75.9833],

  // SAN ANDRÉS Y PROVIDENCIA
  "SAN ANDRÉS": [12.5497, -81.7008],

  // SANTANDER
  "AGUADA": [6.4833, -73.1167],
  "ARATÓCA": [6.4667, -73.1333],
  "BARBOSA": [7.0833, -73.2167],
  "BARICHARA": [6.6333, -73.2167],
  "BARRANCABERMEJA": [7.0667, -73.8500],
  "BETULIA": [6.5667, -73.3167],
  "BUCARAMANGA": [7.1253, -73.1198],
  "CALIFORNIA": [7.3500, -73.3667],
  "CAPITANEJO": [6.4833, -72.6000],
  "CARCASÍ": [6.5667, -72.7167],
  "CEPITÁ": [6.9500, -73.1167],
  "CERRITO": [6.8167, -73.2500],
  "CHARALÁ": [6.3000, -73.1500],
  "CHARTA": [6.7167, -73.1500],
  "CHIMA": [6.4667, -73.2500],
  "CHIPATÁ": [6.3667, -73.6000],
  "CIMITARRA": [6.9833, -73.5500],
  "CONFINES": [6.5500, -73.1667],
  "CONTRATACIÓN": [6.2500, -73.2167],
  "COROMORO": [6.2500, -73.0833],
  "CURITÍ": [6.5500, -73.0667],
  "EL CARMEN DE CHUCURÍ": [7.2333, -73.4667],
  "EL GUACAMAYO": [6.4167, -73.1333],
  "EL PLAYÓN": [7.4167, -73.2167],
  "ENCINO": [6.1333, -73.0833],
  "FLORIDABLANCA": [7.0667, -73.0833],
  "FLORIÁN": [6.1833, -73.2833],
  "GALÁN": [6.5667, -73.3167],
  "GÁMBITA": [6.0500, -73.4667],
  "GIRÓN": [7.0667, -73.1667],
  "GÜEPSA": [6.4167, -73.1333],
  "GUACA": [6.5667, -72.9167],
  "GUAPOTÁ": [6.4167, -73.2000],
  "GUAVATA": [6.3167, -73.3167],
  "HATO": [6.3500, -73.2500],
  "JESÚS MARÍA": [6.5167, -73.2167],
  "JORDÁN": [6.8833, -73.0833],
  "LA BELLEZA": [6.6500, -73.7500],
  "LA PAZ": [6.1667, -73.5833],
  "LEBRIJA": [7.2167, -73.2833],
  "LOS SANTOS": [6.7500, -73.0833],
  "MACARAVITA": [6.5500, -72.6167],
  "MÁLAGA": [6.7167, -72.9167],
  "MATANZA": [6.4667, -73.2500],
  "MOGOTES": [6.4833, -73.0833],
  "MOLAGAVITA": [6.5500, -72.7500],
  "OCAMONTE": [6.4333, -72.6000],
  "OIBA": [6.5333, -73.2500],
  "ONZAGA": [6.8667, -73.2167],
  "PALMAR": [6.4333, -73.1500],
  "PALMAS DEL SOCORRO": [6.8667, -73.2167],
  "PÁRAMO": [6.4167, -72.9167],
  "PIEDECUESTA": [7.0833, -73.0500],
  "PINCHOTE": [6.9833, -73.2167],
  "PUENTE NACIONAL": [7.3333, -73.3167],
  "PUERTO PARRA": [7.3833, -73.8500],
  "PUERTO WILCHES": [7.3000, -73.9167],
  "RIONEGRsO": [7.3667, -73.1667],
  "SABANA DE TORRES": [7.3667, -73.9167],
  "SAN BENITO": [6.4667, -73.0167],
  "SAN GIL": [6.5500, -73.1333],
  "SAN JOAQUÍN": [6.4500, -73.0833],
  "SAN JOSÉ DE MIRANDA": [6.4500, -72.9167],
  "SAN MARCOS": [8.6500, -73.6500],
  "SAN VICENTE DE CHUCURÍ": [7.1333, -73.3833],

  "SANTA HELENA DEL OPÓN": [7.0000, -73.4167],
  "SIMACOTA": [6.9167, -73.4833],
  "SOCORRO": [6.4667, -73.2833],
  "SUAITA": [6.3833, -73.4833],
  "SURATÁ": [7.3500, -73.1833],
  "TONA": [7.2500, -73.1167],
  "VALLE DE SAN JOSÉ": [6.6167, -73.0833],
  "VÉLEZ": [6.0167, -73.6667],
  "VETAS": [7.3333, -72.9167],
  "ZAPATÓCA": [7.2167, -73.2500],

  // SUCRE
  "CAIMITO": [9.1167, -75.2833],
  "CHALÁN": [9.4167, -75.2833],
  "COLOSÓ": [9.5000, -75.3500],
  "COROZAL": [9.2833, -75.3000],
  "COVEÑAS": [9.4167, -75.6833],
  "EL ROBLE": [9.1500, -75.2167],
  "GALERAS": [9.2500, -75.1333],
  "GUARANDA": [9.2500, -75.2500],

  "LOS PALMITOS": [9.2167, -75.2500],
  "MAJAGUAL": [8.9833, -74.7167],
  "MORROA": [9.2833, -75.2167],
  "OVEJAS": [9.5167, -75.2167],
  "PALMITO": [9.2500, -75.2500],
  "SAMPUÉS": [9.1833, -75.2500],
  "SAN BENITO ABAD": [8.8500, -74.8333],
  "SAN JUAN DE BETULIA": [9.1500, -75.1667],
  "SAN LUIS DE SINCÉ": [9.2500, -75.1167],
  "SAN ONOFRE": [9.7333, -75.5167],
  "SAN PEDRO": [9.4167, -75.8000],
  "SINCELEJO": [9.3047, -75.3973],
  "SINCÉ": [9.1500, -75.1500],
  "SUCRE": [8.8167, -74.7167],
  "TOLÚ": [9.5167, -75.5833],
  "TOLUVIEJO": [9.5000, -75.4167],

  // TOLIMA
  "ALPUJARRA": [4.2833, -75.0000],
  "ALVARADO": [4.5667, -74.9500],
  "AMBALEMA": [4.7833, -74.8833],
  "ANZOÁTEGUI": [4.8333, -75.2500],
  "ARMERO": [4.9500, -74.9000],
  "ATACO": [3.9833, -75.3833],
  "CAJAMARCA": [4.4167, -75.4500],
  "CARMEN DE APICALÁ": [4.1333, -74.9167],
  "CASABIANCA": [4.7500, -75.3333],
  "CHAPARRAL": [3.7167, -75.4833],
  "COELLO": [4.2500, -74.9000],
  "COYAIMA": [3.8833, -75.2167],
  "CUNDAY": [4.0833, -74.8333],
  "DOLORES": [4.1500, -74.8667],
  "ESPINAL": [4.1500, -74.9000],
  "FALÁN": [5.0000, -74.9500],
  "FLANDES": [4.0833, -74.8333],
  "FRESNO": [5.1500, -75.0333],
  "GUAMO": [4.0500, -74.9167],
  "HERVEO": [4.8500, -75.2833],
  "HONDA": [5.2000, -74.7333],
  "IBAGUÉ": [4.4389, -75.2322],
  "ICONONZO": [4.1333, -74.9000],
  "LÉRIDA": [4.8833, -74.9500],
  "LÍBANO": [4.9167, -75.1333],
  "MARIQUITA": [5.2000, -74.9167],
  "MELGAR": [4.2000, -74.6333],
  "MURILLO": [4.8833, -75.1500],
  "NATAGAIMA": [4.0000, -75.1167],
  "ORTEGA": [3.9333, -75.2500],
  "PALOCABILDO": [5.0167, -75.0833],
  "PIEDRAS": [4.5000, -74.9833],
  "PLANADAS": [3.9167, -75.6500],
  "PRADO": [3.8833, -74.8667],
  "PURIFICACIÓN": [3.9000, -75.2167],
  "RIOBLANCO": [3.8833, -75.7167],
  "RONCESVALLES": [4.0833, -75.2500],
  "ROVIRA": [4.2500, -74.9167],
  "SALDAÑA": [4.2500, -74.8833],
  "SAN ANTONIO": [4.3833, -75.0167],
  "SAN ISABEL": [4.1667, -75.1500],

  "VALLE DE SAN JUAN": [4.0833, -75.1333],
  "VENADILLO": [4.7000, -74.9167],
  "VILLAHERMOSA": [4.6500, -75.2333],
  "VILLARRICA": [4.4167, -75.2500],

  // VALLE DEL CAUCA
  "ALCALÁ": [4.6167, -75.7833],
  "ANDALUCÍA": [4.1000, -76.1833],
  "ANSERMANUEVO": [4.7833, -76.1333],
  "BUENAVENTURA": [3.8833, -77.0333],
  "BUGA": [3.9000, -76.3000],
  "BUGALAGRANDE": [4.4167, -76.2833],
  "CAICEDONIA": [4.7167, -75.8333],
  "CALI": [3.4516, -76.5319],
  "CALIMA": [3.8833, -76.5167],
  "CARTAGO": [4.7667, -75.9167],
  "DAGUA": [3.6500, -76.6833],
  "EL ÁGUILA": [4.6500, -76.1333],
  "EL CAIRO": [4.7833, -76.2000],
  "EL CERRITO": [3.6833, -76.3167],
  "EL DOVIO": [4.5500, -76.1667],
  "FLORIDA": [3.3333, -76.2333],
  "GINEBRA": [3.9833, -76.2667],
  "GUACARÍ": [3.9833, -76.3500],
  "GUADALAJARA DE BUGA": [3.9000, -76.3000],
  "JAMUNDÍ": [3.2500, -76.5333],
  "LA CUMBRE": [3.6667, -76.5333],
  "OBANDO": [4.5667, -76.0500],
  "PALMIRA": [3.5333, -76.3000],
  "PRADERA": [3.4167, -76.5167],
  "RIOFRÍO": [4.1500, -76.2667],
  "ROLDANILLO": [4.4167, -76.1500],
  "SEVILLA": [4.2667, -75.9333],
  "TORO": [4.6000, -76.1333],
  "TRUJILLO": [4.7500, -76.3167],
  "TULUÁ": [4.0833, -76.1833],
  "ULLOA": [4.1833, -75.9667],
  "VERSALLES": [4.5333, -75.8500],
  "VIJES": [3.6000, -76.4333],
  "YOTOCO": [3.8833, -76.4167],
  "YUMBO": [3.5833, -76.5000],
  "ZARZAL": [4.3833, -76.1500],

  // VAUPÉS
  "CARURÚ": [0.6167, -69.4333],
  "MITÚ": [1.2500, -70.2333],
  "PAPUNAHUA": [1.0833, -70.2500],
  "TARAIRA": [0.3833, -69.5000],
  "VAUPÉS": [1.2500, -70.2333],
  "YAVARATÉ": [0.4167, -69.5333],

  // VICHADA
  "CUMARIBO": [4.3833, -70.5500],
  "LA PRIMAVERA": [5.4833, -70.2167],
  "PUERTO CARREÑO": [6.1833, -67.5000],
  "SANTA ROSALÍA": [6.0500, -67.9167]
};


// --- Helpers ---
const normalize = (s: string) => {
  if (!s) return "";
  return s
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/’/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
};

const VoterMapByDepartment: React.FC = () => {
  const [municipalityData, setMunicipalityData] = useState<MpioData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeMunicipioKey, setActiveMunicipioKey] = useState<string | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({}); // por nombre normalizado

  // Carga CSS/JS de Leaflet
  const loadLeafletAssets = () => {
    const ensureCss = () =>
      new Promise<void>((resolve, reject) => {
        const id = "leaflet-css";
        if (document.getElementById(id)) return resolve();
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
        link.crossOrigin = "";
        link.onload = () => resolve();
        link.onerror = () => reject(new Error("Failed to load Leaflet CSS"));
        document.head.appendChild(link);
      });

    const ensureJs = () =>
      new Promise<void>((resolve, reject) => {
        if (window.L) return resolve();
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
        script.crossOrigin = "";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Leaflet script"));
        document.head.appendChild(script);
      });

    return Promise.all([ensureCss(), ensureJs()]);
  };

  useEffect(() => {
    const initializeMap = async () => {
      try {
        await loadLeafletAssets();

        // ✅ Usa el API de MUNICIPIOS
        const response = await fetch(
          "https://devsoul.co/api_votantes/votantes_por_municipio.php?_t=" + Date.now()
        );
        const result = await response.json();
        if (!result?.success) throw new Error(result.message || "Error al cargar datos del mapa");

        const incoming: MpioData[] = result.data || [];
        setMunicipalityData(incoming);

        setTimeout(() => {
          if (mapRef.current && window.L) {
            const map = L.map(mapRef.current).setView([9.5, -74.8], 6);
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(map);
            setTimeout(() => map.invalidateSize(), 200);
            mapInstanceRef.current = map;

            // Icono personalizado para municipios
            const createCustomIcon = (mpio: MpioData) => {
              return L.divIcon({
                className: "custom-marker",
                html: `
                  <div class="relative flex flex-col items-center">
                    <div class="bg-blue-500 text-white text-xs font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-lg border-2 border-white">
                      ${mpio.TOTAL}
                    </div>
                    <div class="bg-white rounded-md px-2 py-1 shadow-md border border-gray-200 mt-1">
                      <p class="text-xs font-semibold text-gray-700 whitespace-nowrap">${mpio.MUNICIPIO}</p>
                    </div>
                  </div>
                `,
                iconSize: [90, 48],
                iconAnchor: [45, 45],
                popupAnchor: [0, -38],
              });
            };

            // Marcadores (solo > 0) y por clave normalizada
            incoming
              .filter((d) => d.TOTAL > 0)
              .forEach((mpio) => {
                const key = normalize(mpio.MUNICIPIO);
                const position = municipalityCoordinates[key];
                
                if (!position) {
                  console.warn(`Sin coordenadas para: ${mpio.MUNICIPIO} (${key})`);
                  return;
                }

                const popupContent = `
                  <div class="p-3 min-w-[240px] font-sans">
                    <h3 class="font-bold text-lg text-gray-800 mb-3 border-b pb-2">${mpio.MUNICIPIO}</h3>
                    <div class="space-y-2 text-sm">
                      <p class="flex items-center justify-between">
                        <span class="font-medium text-gray-600">Departamento:</span>
                        <span class="text-gray-800 font-semibold">${mpio.DEPARTAMENTO}</span>
                      </p>
                      <p class="flex items-center justify-between">
                        <span class="font-medium text-gray-600">Votantes:</span>
                        <span class="text-indigo-600 font-bold text-lg">${mpio.TOTAL}</span>
                      </p>
                    </div>
                  </div>
                `;

                const marker = L.marker(position, { icon: createCustomIcon(mpio) })
                  .addTo(map)
                  .bindPopup(popupContent);

                markersRef.current[key] = marker;
              });
          }
        }, 150);
      } catch (e: any) {
        setError(e.message);
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    };

    initializeMap();

    return () => {
      if (mapInstanceRef.current) mapInstanceRef.current.remove();
    };
  }, []);

  // Foco por municipio
  const focusOnMunicipality = (mpio: MpioData) => {
    const key = normalize(mpio.MUNICIPIO);
    const position = municipalityCoordinates[key];
    if (!position || !mapInstanceRef.current) return;

    mapInstanceRef.current.setView(position, 9, { animate: true });
    setActiveMunicipioKey(key);

    const marker = markersRef.current[key];
    if (marker) marker.openPopup();
  };

  // KPIs (calculados desde los datos de municipios)
  const listData = municipalityData.filter((d) => d.TOTAL > 0);
  const totalVoters = listData.reduce((sum, d) => sum + d.TOTAL, 0);
  const totalMpios = listData.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-red-600">
        <p className="text-xl font-semibold">Error al cargar el mapa</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-xl transition-all duration-300 ease-in-out ${isSidebarOpen ? "w-80" : "w-0"} overflow-hidden`}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <BarChart3 className="w-6 h-6 mr-2 text-indigo-600" />
              Panel de Municipios
            </h2>
            <div className="flex items-center gap-2">
              <Link to="/dashboard" className="p-2 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all" title="Volver al Dashboard">
                <ChevronLeft className="w-5 h-5 text-blue-600" />
              </Link>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-lg hover:bg-gray-100" title="Cerrar panel">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
              <p className="text-indigo-600 text-xs font-medium">Total Mpios</p>
              <p className="text-2xl font-bold text-indigo-800">{totalMpios}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-xs font-medium">Total Votantes</p>
              <p className="text-2xl font-bold text-gray-800">{totalVoters}</p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Lista de Municipios</h3>
            <div className="space-y-1 max-h-96 overflow-y-auto pr-2">
              {listData.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No hay municipios con votantes registrados.</p>
              ) : (
                listData.map((mpio) => {
                  const key = normalize(mpio.MUNICIPIO);
                  return (
                    <div
                      key={key}
                      onClick={() => focusOnMunicipality(mpio)}
                      className={`p-2 rounded-lg cursor-pointer transition-colors duration-200 flex items-center justify-between ${
                        activeMunicipioKey === key ? "bg-indigo-100 border border-indigo-300" : "hover:bg-gray-100"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">{mpio.MUNICIPIO}</p>
                        <p className="text-xs text-gray-500">{mpio.DEPARTAMENTO}</p>
                      </div>
                      <span className="text-indigo-600 font-bold text-sm">{mpio.TOTAL}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div className="flex-1 relative">
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md z-10 p-4">
          {!isSidebarOpen && (
            <button onClick={() => setIsSidebarOpen(true)} className="absolute top-4 left-4 z-10 bg-white p-2 rounded-full shadow-lg hover:shadow-xl transition-shadow">
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
          )}
          <h1 className="text-2xl font-bold text-white">Mapa de Votantes por Municipio</h1>
          <p className="text-sm text-blue-100">Explora los municipios y haz clic en los marcadores para ver detalles.</p>
        </div>
        <div ref={mapRef} className="w-full h-full" style={{ marginTop: "80px" }} />
      </div>
    </div>
  );
};

export default VoterMapByDepartment;