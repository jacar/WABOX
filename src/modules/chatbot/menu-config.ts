export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface MenuCategory {
  category: string;
  items: MenuItem[];
}

import { IsString, IsArray } from 'class-validator';

export class RestaurantConfig {
  @IsString()
  name: string;

  @IsString()
  catalogUrl: string;

  @IsString()
  address: string;

  @IsString()
  mapsUrl: string;

  @IsString()
  hours: string;

  @IsString()
  phone: string;

  @IsArray()
  menu: MenuCategory[];
}

export const RESTAURANT_CONFIG: RestaurantConfig = {
  name: 'El Gran Sabor 🍔🍕',
  catalogUrl: 'https://wa.me/c/584222891719', // URL de su catálogo de WhatsApp Business
  address: 'Calle 10 # 5-24, Centro Histórico',
  mapsUrl: 'https://maps.google.com/?q=Calle+10+#+5-24',
  hours: 'Lunes a Sábado: 12:00 PM - 10:00 PM | Domingos: 12:00 PM - 8:00 PM',
  phone: '+58 422 2891719',
  menu: [
    {
      category: 'Hamburguesas Exquisitas 🍔',
      items: [
        {
          id: 'h1',
          name: 'Hamburguesa Clásica',
          price: 15000,
          description: 'Carne artesanal de 150g, queso cheddar, lechuga fresca, tomate y salsa de la casa.',
        },
        {
          id: 'h2',
          name: 'Hamburguesa Especial',
          price: 19000,
          description: 'Carne artesanal, queso cheddar, tocino crujiente, cebolla caramelizada, huevo frito y ripio.',
        },
        {
          id: 'h3',
          name: 'Hamburguesa Doble Carne',
          price: 24000,
          description: 'Doble porción de carne premium de 150g, doble queso cheddar, tocino y salsas especiales.',
        },
      ],
    },
    {
      category: 'Pizzas Artesanales 🍕',
      items: [
        {
          id: 'p1',
          name: 'Pizza Pepperoni',
          price: 22000,
          description: 'Salsa de tomate casera, queso mozzarella fundido de excelente calidad y abundantes rodajas de pepperoni.',
        },
        {
          id: 'p2',
          name: 'Pizza Hawaiana',
          price: 20000,
          description: 'El clásico dulce y salado: jamón premium seleccionado y piña dulce calada.',
        },
        {
          id: 'p3',
          name: 'Pizza Suprema',
          price: 26000,
          description: 'Mozzarella, carne molida de res, jamón, pepperoni, cebolla, pimentón verde y champiñones.',
        },
      ],
    },
    {
      category: 'Acompañamientos 🍟',
      items: [
        {
          id: 'a1',
          name: 'Papas Fritas Medianas',
          price: 6000,
          description: 'Papas a la francesa doradas y crujientes, sazonadas a la perfección.',
        },
        {
          id: 'a2',
          name: 'Papas Rústicas con Queso y Tocino',
          price: 10000,
          description: 'Porción grande de papas rústicas bañadas en queso cheddar fundido y tocino crujiente picado.',
        },
      ],
    },
    {
      category: 'Bebidas Heladas 🥤',
      items: [
        {
          id: 'b1',
          name: 'Gaseosa Coca-Cola 400ml',
          price: 4500,
          description: 'Gaseosa Coca-Cola Original bien fría.',
        },
        {
          id: 'b2',
          name: 'Jugo Natural en Agua',
          price: 5000,
          description: 'Jugo de fruta fresca de temporada (Fresa, Mango, Lulo o Maracuyá).',
        },
      ],
    },
  ],
};
