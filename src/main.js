/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
    const discountedPrice = purchase.sale_price * (1 - purchase.discount / 100);
    return discountedPrice * purchase.quantity;
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
    const baseBonus = seller.profit * 0.1; // 10% базово
    
    if (index === 0) return Math.round(baseBonus * 5);     // 1-е: 50%
    if (index === 1) return Math.round(baseBonus * 3);     // 2-е: 30%
    if (index === 2) return Math.round(baseBonus * 2);     // 3-е: 20%
    
    return Math.round(baseBonus); // остальные: 10%
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

    // Проверка входных данных
    if (!data || !data.sellers || !data.products || !data.purchase_records) {
        return [];
    }

    // Проверка наличия опций
    const calculateRevenue = options.calculateRevenue || calculateSimpleRevenue;
    const calculateBonus = options.calculateBonus || calculateBonusByProfit;
    const topProductsCount = options.topProductsCount || 10;

    // Подготовка промежуточных данных для сбора статистики
    const sellerStats = {};

    // Индексация продавцов и товаров для быстрого доступа
    const sellersById = {};
    const productsBySku = {};
    
    data.sellers.forEach(seller => {
        sellersById[seller.id] = seller;
        sellerStats[seller.id] = {
            revenue: 0,
            profit: 0,
            sales_count: 0,
            items: {}
        };
    });
    
    data.products.forEach(product => {
        productsBySku[product.sku] = product;
    });

    // Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(receipt => {
        const sellerId = receipt.seller_id;
        if (!sellerStats[sellerId]) return;

        receipt.items.forEach(item => {
            const product = productsBySku[item.sku];
            if (!product) return;

            // Выручка через функцию из опций
            const revenue = calculateRevenue(item, product);
            sellerStats[sellerId].revenue += revenue;

            // Прибыль = (цена продажи со скидкой - закупочная) * количество
            const salePriceDiscounted = item.sale_price * (1 - item.discount / 100);
            const profit = (salePriceDiscounted - product.purchase_price) * item.quantity;
            sellerStats[sellerId].profit += profit;

            // Счетчик товаров
            sellerStats[sellerId].items[item.sku] = 
                (sellerStats[sellerId].items[item.sku] || 0) + item.quantity;
        });

        sellerStats[sellerId].sales_count += 1;
    });

    // Сортировка продавцов по прибыли (по убыванию)
    const sortedSellerIds = Object.keys(sellerStats)
        .filter(sellerId => sellerStats[sellerId].sales_count > 0)
        .sort((a, b) => sellerStats[b].profit - sellerStats[a].profit);

    // Назначение премий на основе ранжирования
    sortedSellerIds.forEach((sellerId, index) => {
        const totalSellers = sortedSellerIds.length;
        const sellerData = {
            profit: sellerStats[sellerId].profit
        };
        sellerStats[sellerId].bonus = calculateBonus(index, totalSellers, sellerData);
    });

    // Подготовка итоговой коллекции с нужными полями
    return sortedSellerIds.map(sellerId => {
        const stats = sellerStats[sellerId];
        const seller = sellersById[sellerId];
        if (!seller || stats.sales_count === 0) return null;

        // Топ-N товаров
        const topProducts = Object.entries(stats.items)
            .sort(([,a], [,b]) => b - a)
            .slice(0, topProductsCount)
            .map(([sku, quantity]) => ({ sku, quantity }));

        return {
            seller_id: seller.id,
            name: `${seller.first_name} ${seller.last_name}`,
            revenue: Math.round(stats.revenue),
            profit: Math.round(stats.profit),
            sales_count: stats.sales_count,
            top_products: topProducts,
            bonus: Math.round(stats.bonus)
        };
    }).filter(Boolean);
}
