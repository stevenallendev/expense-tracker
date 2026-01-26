import { useMemo } from "react";


//Function to filter displayed results by selected month/year
export default function useFilteredExpenses({
    expenses,
    categoryFilter,
    month,
    year,
    months,
}) {
    return useMemo(() => {
        return expenses.filter((e) => {
            const d = new Date(e.date);
            const expenseMonth = d.getMonth();
            const expenseYear = d.getFullYear();

            if (categoryFilter !== "All" && e.category !== categoryFilter) {
                return false;
            }

            if (month) {
                const selectedMonthIndex = months.indexOf(month);
                if (expenseMonth !== selectedMonthIndex) {
                    return false;
                }
            }

            if (year && expenseYear !== Number(year)) {
                return false;
            }

            return true;
        });
    }, [expenses, categoryFilter, month, year, months]);
}
