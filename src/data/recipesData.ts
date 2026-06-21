export const RECIPES_DETAILS: Record<string, { pasos_preparacion: string[]; alergenos: string[]; consejo_emplatado: string }> = {
  prod_ent_provoleta: {
    pasos_preparacion: [
      'Espolvorear la provoleta fría con orégano por ambas caras.',
      'Llevar al horno de barro en provoletera de hierro fundido hasta fundir y dorar las esquinas.',
      'Retirar, decorar con tomates confitados y terminar con un hilo de aceite de oliva.'
    ],
    alergenos: ['Lácteos'],
    consejo_emplatado: 'Servir en la misma provoletera de hierro caliente apoyada sobre una tabla de madera.'
  },
  prod_ent_empanadas: {
    pasos_preparacion: [
      'Disponer las empanadas de carne criolla en una bandeja para horno.',
      'Hornear a leña a 280°C durante 6-8 minutos hasta que la masa quede inflada y dorada.',
      'Retirar y dejar reposar 1 minuto antes de servir.'
    ],
    alergenos: ['Gluten', 'Huevo'],
    consejo_emplatado: 'Presentar en canastita de mimbre rústica con servilleta de papel absorbente.'
  },
  prod_ent_faina_simple: {
    pasos_preparacion: [
      'Preparar la mezcla líquida con harina de garbanzos, agua, sal, pimienta y aceite.',
      'Verter en molde pizzero bien caliente y aceitado.',
      'Hornear a fuego fuerte a leña hasta lograr un dorado crocante en la base y los bordes.'
    ],
    alergenos: [],
    consejo_emplatado: 'Servir cortada en porciones triangulares finas.'
  },
  prod_ent_faina_verdeo: {
    pasos_preparacion: [
      'Preparar la mezcla líquida de fainá incorporando cebolla de verdeo rehogada previamente.',
      'Verter en molde pizzero caliente.',
      'Antes de terminar la cocción, espolvorear parmesano rallado y gratinar.'
    ],
    alergenos: ['Lácteos'],
    consejo_emplatado: 'Servir caliente espolvoreada con verdeo fresco picado.'
  },
  prod_pas_muzarela: {
    pasos_preparacion: [
      'Estirar el bollo de masa de pizza base en un molde de 35 cm de diámetro.',
      'Esparcir la salsa de tomate casera de forma uniforme.',
      'Llevar a una primera cocción rápida (precocinar la masa).',
      'Distribuir el queso mozzarella rallado y hornear a leña hasta fundir y gratinar el queso.',
      'Decorar con aceitunas verdes y orégano.'
    ],
    alergenos: ['Gluten', 'Lácteos'],
    consejo_emplatado: 'Cortar en 8 porciones y presentar en tabla de madera para pizza de mesa.'
  },
  prod_pas_especial: {
    pasos_preparacion: [
      'Estirar el bollo de masa y agregar salsa de tomate base.',
      'Distribuir queso mozzarella y hornear hasta fundir.',
      'Al retirar del horno, cubrir con fetas de jamón cocido y colocar tiras de morrones asados en conserva.',
      'Terminar con aceitunas verdes y espolvorear orégano.'
    ],
    alergenos: ['Gluten', 'Lácteos'],
    consejo_emplatado: 'Servir caliente en bandeja metálica redonda clásica de pizzería.'
  },
  prod_pas_calabresa: {
    pasos_preparacion: [
      'Estirar la masa y colocar salsa de tomate casera.',
      'Distribuir la mozzarella y las rodajas finas de longaniza calabresa.',
      'Hornear a alta temperatura hasta dorar los bordes e integrar el aceite de la longaniza con el queso.',
      'Coronar con aceitunas negras y una pizca de ají molido.'
    ],
    alergenos: ['Gluten', 'Lácteos'],
    consejo_emplatado: 'Cortar en 8 porciones simétricas y servir caliente.'
  },
  prod_pas_fugazzeta: {
    pasos_preparacion: [
      'Estirar la masa y cubrir con una capa generosa de queso mozzarella.',
      'Colocar encima la cebolla cortada en juliana fina y previamente sazonada con oliva y sal.',
      'Hornear a leña hasta que la cebolla quede tierna y levemente caramelizada en las puntas.'
    ],
    alergenos: ['Gluten', 'Lácteos'],
    consejo_emplatado: 'Servir recién salida del horno en tabla de madera rústica.'
  },
  prod_car_margherita_premium: {
    pasos_preparacion: [
      'Estirar el bollo de masa estilo napolitano a mano, dejando el borde (cornicione) alto.',
      'Trazar círculos de salsa de tomate triturado de alta calidad.',
      'Colocar trozos de mozzarella Fior di Latte esparcidos.',
      'Hornear a la piedra a máxima temperatura por 90 segundos.',
      'Al retirar, decorar con hojas de albahaca fresca y verter un hilo de aceite de oliva extra virgen.'
    ],
    alergenos: ['Gluten', 'Lácteos'],
    consejo_emplatado: 'Presentar entera sobre plato plano grande de cerámica para apreciar los bordes aireados.'
  },
  prod_car_cuatro_quesos: {
    pasos_preparacion: [
      'Estirar la masa base de pizza.',
      'Distribuir de forma equitativa muzzarella, provolone rallado y queso azul desgranado.',
      'Hornear a leña hasta fundir y amalgamar los quesos.',
      'Al retirar, espolvorear queso parmesano rallado fresco.'
    ],
    alergenos: ['Gluten', 'Lácteos'],
    consejo_emplatado: 'Servir bien caliente para disfrutar la combinación de texturas de los quesos fundidos.'
  },
  prod_car_rucula_crudo: {
    pasos_preparacion: [
      'Estirar la masa, colocar salsa de tomate y muzzarella.',
      'Hornear hasta que el queso esté completamente derretido y burbujeante.',
      'Al salir del horno, colocar las fetas de jamón crudo de forma decorativa.',
      'Cubrir con hojas de rúcula fresca lavada y coronar con lascas de queso parmesano.'
    ],
    alergenos: ['Gluten', 'Lácteos'],
    consejo_emplatado: 'Servir en tabla de madera de eucalipto para destacar los colores frescos de la rúcula y el crudo.'
  },
  prod_car_panceta_verdeo: {
    pasos_preparacion: [
      'Estirar la masa y esparcir queso mozzarella.',
      'Colocar tiras de panceta ahumada laminada.',
      'Hornear hasta fundir el queso y lograr que la panceta quede crujiente.',
      'Al retirar, agregar cebolla de verdeo picada fina y terminar con oliva.'
    ],
    alergenos: ['Gluten', 'Lácteos'],
    consejo_emplatado: 'Servir cortado en porciones en bandeja redonda.'
  },
  prod_pos_flan: {
    pasos_preparacion: [
      'Caramelizar el molde de flan con azúcar fundido.',
      'Mezclar leche entera, huevos y azúcar sin incorporar aire.',
      'Cocinar a baño maría lentamente en horno a 140°C durante 60 minutos.',
      'Enfriar en heladera antes de desmoldar.'
    ],
    alergenos: ['Huevo', 'Lácteos'],
    consejo_emplatado: 'Acompañar la porción con dulce de leche repostero y crema batida.'
  },
  prod_pos_volcan: {
    pasos_preparacion: [
      'Fundir chocolate amargo 70% con manteca.',
      'Mezclar con huevo batido con azúcar y agregar harina tamizada.',
      'Hornear en molde individual a 200°C por exactamente 8 minutos para lograr el centro fluido.'
    ],
    alergenos: ['Gluten', 'Huevo', 'Lácteos'],
    consejo_emplatado: 'Desmoldar al momento de servir y coronar con una bocha de helado de crema americana.'
  },
  prod_pos_tiramisu: {
    pasos_preparacion: [
      'Preparar la crema de mascarpone batiendo yemas con azúcar y mascarpone.',
      'Humedecer vainillas en café expreso mezclado con licor de café.',
      'Alternar capas de vainillas mojadas y crema de mascarpone.',
      'Espolvorear con abundante cacao amargo y enfriar por al menos 4 horas.'
    ],
    alergenos: ['Gluten', 'Huevo', 'Lácteos'],
    consejo_emplatado: 'Servir frío cortado en porciones cuadradas espolvoreadas con cacao extra.'
  }
};
