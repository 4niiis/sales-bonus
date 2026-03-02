/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
    const discount = 1 - (purchase.discount / 100);
    return purchase.sale_price * discount * purchase.quantity;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const profit = seller.profit;
    
    if (index === 0) {
        return Math.round(profit * 0.15);  // 15% для 1-го места
    } 
    else if (index === 1 || index === 2) {
        return Math.round(profit * 0.10);  // 10% для 2-3 мест
    } 
    else if (index === total - 1) {
        return 0;                          // 0% для последнего
    } 
    else {
        return Math.round(profit * 0.05);  // 5% для остальных
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных

    // @TODO: Проверка наличия опций

    // @TODO: Подготовка промежуточных данных для сбора статистики

    // @TODO: Индексация продавцов и товаров для быстрого доступа

    // @TODO: Расчет выручки и прибыли для каждого продавца

    // @TODO: Сортировка продавцов по прибыли

    // @TODO: Назначение премий на основе ранжирования

    // @TODO: Подготовка итоговой коллекции с нужными полями

    // Шаг 1. Проверка входных данных
    if (!data
        || !Array.isArray(data.sellers) 
        || !Array.isArray(data.products)
        || !Array.isArray(data.purchase_records)
        || data.sellers.length === 0
        || data.products.length === 0
        || data.purchase_records.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }

    // Шаг 2. Проверка опций
    const { calculateRevenue, calculateBonus } = options;
    if (!calculateRevenue || !calculateBonus || 
        typeof calculateRevenue !== 'function' || 
        typeof calculateBonus !== 'function') {
        throw new Error('Чего-то не хватает');
    }

    // Шаг 3. Подготовка промежуточных данных
    const sellerStats = data.sellers.map(seller => ({
        seller_id: seller.id,
        first_name: seller.first_name,
        last_name: seller.last_name,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

    // Шаг 4. Индексация продавцов и товаров
    const sellerIndex = Object.fromEntries(
        sellerStats.map(seller => [seller.seller_id, seller])
    );
    const productIndex = Object.fromEntries(
        data.products.map(product => [product.sku, product])
    );

    // Бизнес-логика: двойной цикл
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        if (!seller) return;

        // Увеличиваем счётчики чека
        seller.sales_count += 1;
        seller.revenue += record.total_amount;

        // Обрабатываем товары в чеке
        record.items.forEach(item => {
            const product = productIndex[item.sku];
            if (!product) return;

            // Считаем прибыль для товара
            const revenue = calculateRevenue(item, product);
            const cost = product.purchase_price * item.quantity;
            const profit = revenue - cost;
            
            seller.profit += profit;

            // Считаем количество проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });
    });

    // Шаг 2 бизнес-логики: сортировка по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);

    // Шаг 3 бизнес-логики: бонусы и топ товаров
    sellerStats.forEach((seller, index) => {
        const total = sellerStats.length;
        seller.bonus = calculateBonus(index, total, seller);

        // Топ-10 товаров
        seller.top_products = Object.entries(seller.products_sold)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([sku, quantity]) => ({ sku, quantity }));
    });

    // Шаг 4. Итоговый результат
    return sellerStats.map(seller => ({
        seller_id: seller.seller_id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
    }));
}
