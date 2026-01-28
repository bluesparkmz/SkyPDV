import { Product, Category } from "@/types/product";

export const categories: Category[] = [
  { id: "all", name: "Todos", icon: "Grid" },
  { id: "bebidas", name: "Bebidas", icon: "DrinkCoffee" },
  { id: "lanches", name: "Lanches", icon: "Food" },
  { id: "doces", name: "Doces", icon: "Cupcake" },
  { id: "pratos", name: "Pratos", icon: "Bowl" },
  { id: "outros", name: "Outros", icon: "Box" },
];

export const products: Product[] = [
  // Bebidas
  { id: "1", name: "Coca-Cola 350ml", price: 5.50, category: "bebidas", image: "🥤", stock: 50 },
  { id: "2", name: "Guaraná 350ml", price: 4.50, category: "bebidas", image: "🧃", stock: 45 },
  { id: "3", name: "Água Mineral", price: 2.50, category: "bebidas", image: "💧", stock: 100 },
  { id: "4", name: "Suco Natural", price: 8.00, category: "bebidas", image: "🍹", stock: 30 },
  { id: "5", name: "Café Expresso", price: 4.00, category: "bebidas", image: "☕", stock: 80 },
  { id: "6", name: "Cerveja 350ml", price: 7.50, category: "bebidas", image: "🍺", stock: 60 },
  { id: "7", name: "Chá Gelado", price: 6.00, category: "bebidas", image: "🧋", stock: 35 },
  { id: "8", name: "Milkshake", price: 12.00, category: "bebidas", image: "🥛", stock: 25 },
  { id: "9", name: "Vinho Tinto", price: 45.00, category: "bebidas", image: "🍷", stock: 20 },
  { id: "10", name: "Whisky", price: 25.00, category: "bebidas", image: "🥃", stock: 15 },
  
  // Lanches
  { id: "11", name: "X-Burger", price: 18.00, category: "lanches", image: "🍔", stock: 25 },
  { id: "12", name: "X-Salada", price: 20.00, category: "lanches", image: "🥗", stock: 20 },
  { id: "13", name: "Hot Dog", price: 12.00, category: "lanches", image: "🌭", stock: 35 },
  { id: "14", name: "Pizza Fatia", price: 10.00, category: "lanches", image: "🍕", stock: 40 },
  { id: "15", name: "Sanduíche", price: 15.00, category: "lanches", image: "🥪", stock: 28 },
  { id: "16", name: "Tacos", price: 14.00, category: "lanches", image: "🌮", stock: 22 },
  { id: "17", name: "Burrito", price: 16.00, category: "lanches", image: "🌯", stock: 18 },
  { id: "18", name: "Croissant", price: 8.00, category: "lanches", image: "🥐", stock: 30 },
  { id: "19", name: "Pretzel", price: 7.00, category: "lanches", image: "🥨", stock: 25 },
  { id: "20", name: "Pão Francês", price: 2.00, category: "lanches", image: "🥖", stock: 100 },
  
  // Doces
  { id: "21", name: "Chocolate", price: 6.00, category: "doces", image: "🍫", stock: 55 },
  { id: "22", name: "Sorvete", price: 8.00, category: "doces", image: "🍦", stock: 40 },
  { id: "23", name: "Bolo Fatia", price: 9.00, category: "doces", image: "🍰", stock: 18 },
  { id: "24", name: "Cookie", price: 4.00, category: "doces", image: "🍪", stock: 65 },
  { id: "25", name: "Donut", price: 5.00, category: "doces", image: "🍩", stock: 42 },
  { id: "26", name: "Cupcake", price: 7.00, category: "doces", image: "🧁", stock: 30 },
  { id: "27", name: "Pudim", price: 8.00, category: "doces", image: "🍮", stock: 20 },
  { id: "28", name: "Pirulito", price: 2.00, category: "doces", image: "🍭", stock: 80 },
  { id: "29", name: "Bala", price: 1.00, category: "doces", image: "🍬", stock: 150 },
  { id: "30", name: "Torta", price: 12.00, category: "doces", image: "🥧", stock: 15 },
  { id: "31", name: "Mel", price: 15.00, category: "doces", image: "🍯", stock: 20 },
  
  // Pratos
  { id: "32", name: "Arroz c/ Feijão", price: 15.00, category: "pratos", image: "🍚", stock: 50 },
  { id: "33", name: "Espaguete", price: 22.00, category: "pratos", image: "🍝", stock: 30 },
  { id: "34", name: "Frango Grelhado", price: 28.00, category: "pratos", image: "🍗", stock: 25 },
  { id: "35", name: "Bife", price: 35.00, category: "pratos", image: "🥩", stock: 20 },
  { id: "36", name: "Peixe Frito", price: 30.00, category: "pratos", image: "🐟", stock: 18 },
  { id: "37", name: "Camarão", price: 45.00, category: "pratos", image: "🦐", stock: 15 },
  { id: "38", name: "Lagosta", price: 80.00, category: "pratos", image: "🦞", stock: 8 },
  { id: "39", name: "Sushi", price: 35.00, category: "pratos", image: "🍣", stock: 20 },
  { id: "40", name: "Curry", price: 25.00, category: "pratos", image: "🍛", stock: 22 },
  { id: "41", name: "Ramen", price: 28.00, category: "pratos", image: "🍜", stock: 18 },
  { id: "42", name: "Ovo Frito", price: 5.00, category: "pratos", image: "🍳", stock: 60 },
  { id: "43", name: "Bacon", price: 12.00, category: "pratos", image: "🥓", stock: 40 },
  { id: "44", name: "Salada Verde", price: 18.00, category: "pratos", image: "🥬", stock: 35 },
  
  // Outros
  { id: "45", name: "Batata Frita", price: 12.00, category: "outros", image: "🍟", stock: 38 },
  { id: "46", name: "Pipoca Grande", price: 15.00, category: "outros", image: "🍿", stock: 50 },
  { id: "47", name: "Nachos", price: 16.00, category: "outros", image: "🧀", stock: 25 },
  { id: "48", name: "Amendoim", price: 8.00, category: "outros", image: "🥜", stock: 45 },
  { id: "49", name: "Azeitonas", price: 10.00, category: "outros", image: "🫒", stock: 30 },
  { id: "50", name: "Abacate", price: 6.00, category: "outros", image: "🥑", stock: 25 },
  { id: "51", name: "Tomate", price: 4.00, category: "outros", image: "🍅", stock: 50 },
  { id: "52", name: "Cebola", price: 3.00, category: "outros", image: "🧅", stock: 60 },
  { id: "53", name: "Alho", price: 5.00, category: "outros", image: "🧄", stock: 40 },
  { id: "54", name: "Pimenta", price: 2.00, category: "outros", image: "🌶️", stock: 70 },
  { id: "55", name: "Banana", price: 3.00, category: "outros", image: "🍌", stock: 80 },
  { id: "56", name: "Maçã", price: 4.00, category: "outros", image: "🍎", stock: 60 },
  { id: "57", name: "Laranja", price: 3.50, category: "outros", image: "🍊", stock: 55 },
  { id: "58", name: "Uva", price: 8.00, category: "outros", image: "🍇", stock: 35 },
  { id: "59", name: "Morango", price: 10.00, category: "outros", image: "🍓", stock: 30 },
  { id: "60", name: "Melancia", price: 12.00, category: "outros", image: "🍉", stock: 20 },
];
