/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _products) {                              // @TODO: Расчет выручки от операции (Шаг 3-1)
    const { discount, sale_price, quantity } = purchase;
    const discountFactor = 1 - (discount / 100);                                    // Переводим скидку из процентов в десятичное число
    const revenue = sale_price * quantity * discountFactor;                         // Расчитываем выручку цена * кол-во * скидку
    return revenue;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {                               // @TODO: Расчет бонуса от позиции в рейтинге (Шаг 3-3)
    const { profit } = seller;

    if (index === 0) {                                                                // на первом месте бонус 15%
        return 0.15 * profit;
    } else if (index === 1) {                                                         // на втором месте бонус 10%
        return 0.1 * profit;
    } else if (index === 2) {                                                         // на третьем месте бонус 10%
        return 0.1 * profit;
    } else if (index === total-1) {                                                   // на последнем месте бонус - 0
        return 0;
    } else {                                
        return 0.05 * profit;                                                         // Для всех остальных бонус- 5% 
    } 
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    const { calculateRevenue, calculateBonus } = options;

    if (!data                                                                       // @TODO: Проверка входных данных (Шаг 2-1)               
        || !Array.isArray(data.sellers)
        || data.sellers.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }

    if (!data               
        || !Array.isArray(data.products)
        || data.products.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }

    if (!data 
        || !Array.isArray(data.purchase_records) 
        || data.purchase_records.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }

    if (!options                                                                    // @TODO: Проверка наличия опций (Шаг 2-2)
        || typeof options !== "object"
        || options === null
    ) {
        throw new Error('Опции некорректны');
    }

    if (typeof calculateRevenue !== "function") {                                   // @TODO: Проверка функций (Шаг 2-2)
        throw new Error('calculateRevenue не является функцией');
    }

    if (typeof calculateBonus !== "function") {
        throw new Error('calculateBonus не является функцией');
    }

    const sellerStats = data.sellers.map(seller => ({                               // @TODO: Подготовка промежуточных данных для сбора статистики (Шаг 2-3)
        name: `${seller.first_name} ${seller.last_name}`,                           // Заполним начальными данными
        id: seller.id,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}                                                           // оставляем пустой объект для дальнейшего наполнения ключ-sku значение-кол-во товаров
    }));
                                                                                    // @TODO: Индексация продавцов для быстрого доступа (Щаг 2-4)
    const sellerIndex = Object.fromEntries(sellerStats.map(saler => [saler.id, saler]));

    const productIndex = data.products.reduce((result, product) => ({               // @TODO: Индексация товаров для быстрого доступа (Щаг 2-4)
        ...result,
        [product.sku]: product                                                      // индексация товаров по ключу sku
    }), {});
                                                                                    // @TODO: Расчет выручки и прибыли для каждого продавца (Шаг 3-1)
    data.purchase_records.forEach(record => {                                       // пройдём по всем чекам
        const seller = sellerIndex[record.seller_id];                               // Из чека берём id продавца
        seller.sales_count += 1;                                                    // Увеличить количество продаж 
        seller.revenue += record.total_amount;                                      // Увеличиваем выручку из каждого чека (минус общую сумму скидки total_discont ???? Изменение к ТЗ )

        record.items.forEach(item => {                                              // Расчёт прибыли для каждого товара
            const product = productIndex[item.sku];                                 // Товар по ключу sku
            const cost = product.purchase_price * item.quantity;                    // Себестоимость количество в чеке умн на стоимость закупки
            const revenue = calculateRevenue(item, productIndex);                   // Посчитать выручку revenue через функцию calculateSimpleRevenue
            const ProductProfit = revenue - cost;                                   // Посчитать прибыль: выручка минус себестоимость
            seller.profit = seller.profit + ProductProfit;                          // Увеличить общую накопленную прибыль (profit) у продавца
                                                                                
            if (!seller.products_sold[item.sku]) {                                  // Учёт количества проданных товаров
                seller.products_sold[item.sku] = 0;
            }
            
            seller.products_sold[item.sku] += item.quantity;                        // По артикулу товара увеличиваем его проданное количество у продавца
        });

        sellerStats.sort((a, b) => b.profit - a.profit);                            // @TODO: Сортировка продавцов по прибыли по убыванию(Шаг 3-2)
    });
       
    sellerStats.forEach((seller, index) => {                                        // @TODO: Назначение премий на основе ранжирования (Шаг 3-3)
        seller.bonus = calculateBonus(index, sellerStats.length, seller);           // Считаем бонус
                                                                                    // Формирование top_products с обработкой крайних случаев
        if (seller.products_sold && Object.keys(seller.products_sold).length > 0) { // проверка если не пустой (длина более 0), то
            seller.top_products = Object.entries(seller.products_sold)              // преобразуем объект products_sold в массив пар [sku, quantity]
                .map(([sku, quantity]) => ({ sku, quantity }))                      // далее его же трансформируем в массив объектов {sku, quantity} методом .map
                .sort((a, b) => b.quantity - a.quantity)                            // далее его же сортируем по убыванию
                .slice(0, 10);                                                      // далее его берём первые 10 элементов методом slice (начало обрезки, конец обрезки)
        } else {
            seller.top_products = [];                                               // если товаров нет оставляем пустым
        }
    })
    
    return sellerStats.map(seller => ({                                             // @TODO: Подготовка итоговой коллекции с нужными полями
        seller_id: seller.id,                                                           // Строка, идентификатор продавца
        name: seller.name,                                                          // Строка, имя продавца
        revenue: +seller.revenue.toFixed(2),                                        // Число с двумя знаками после точки, выручка продавца
        profit: +seller.profit.toFixed(2),                                          // Число с двумя знаками после точки, прибыль продавца
        sales_count: seller.sales_count,                                            // Целое число, количество продаж продавца
        top_products: seller.top_products,                                          // Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
        bonus: +seller.bonus.toFixed(2),                                            // Число с двумя знаками после точки, бонус продавца
    })); 

};