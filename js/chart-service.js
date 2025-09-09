// ENARM Prep - Chart Visualization Service
class ChartService {
    constructor() {
        this.charts = new Map();
        this.defaultColors = [
            '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
            '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',
            '#ec4899', '#6366f1', '#14b8a6', '#f97171'
        ];
        this.themeColors = null;
        this.init();
    }

    init() {
        this.updateThemeColors();
        
        // Listen for theme changes
        if (window.ThemeManager) {
            window.ThemeManager.addThemeChangeListener(() => {
                this.updateThemeColors();
                this.refreshAllCharts();
            });
        }
    }

    // Theme Integration
    updateThemeColors() {
        const isDark = window.ThemeManager ? window.ThemeManager.isDarkTheme() : false;
        
        this.themeColors = {
            text: isDark ? '#f9fafb' : '#1f2937',
            textSecondary: isDark ? '#d1d5db' : '#64748b',
            background: isDark ? '#1f2937' : '#ffffff',
            surface: isDark ? '#374151' : '#f8fafc',
            grid: isDark ? '#4b5563' : '#e5e7eb',
            primary: isDark ? '#3b82f6' : '#2563eb'
        };
    }

    // Chart Creation Methods
    createSpecialtyChart(canvasId, data, options = {}) {
        try {
            const canvas = this.getCanvas(canvasId);
            if (!canvas) return null;

            const ctx = canvas.getContext('2d');
            
            // Destroy existing chart
            this.destroyChart(canvasId);

            const chartConfig = {
                type: 'doughnut',
                data: {
                    labels: data.labels || [],
                    datasets: [{
                        data: data.values || [],
                        backgroundColor: options.colors || this.defaultColors,
                        borderColor: this.themeColors.background,
                        borderWidth: 2,
                        hoverBorderWidth: 3,
                        hoverOffset: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: options.legendPosition || 'bottom',
                            labels: {
                                color: this.themeColors.text,
                                font: {
                                    size: 12
                                },
                                padding: 20,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        },
                        tooltip: {
                            backgroundColor: this.themeColors.surface,
                            titleColor: this.themeColors.text,
                            bodyColor: this.themeColors.text,
                            borderColor: this.themeColors.grid,
                            borderWidth: 1,
                            cornerRadius: 8,
                            callbacks: {
                                label: (context) => {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    const accuracy = data.accuracies ? data.accuracies[context.dataIndex] : null;
                                    
                                    let labelText = `${label}: ${value} preguntas`;
                                    if (accuracy !== null) {
                                        labelText += ` (${accuracy}% precisión)`;
                                    }
                                    return labelText;
                                }
                            }
                        }
                    },
                    animation: {
                        animateScale: true,
                        duration: 1000,
                        easing: 'easeOutCubic'
                    },
                    ...options.chartOptions
                }
            };

            const chart = new Chart(ctx, chartConfig);
            this.charts.set(canvasId, chart);
            return chart;
        } catch (error) {
            ErrorHandler.logError(error, `ChartService.createSpecialtyChart.${canvasId}`);
            return null;
        }
    }

    createProgressChart(canvasId, data, options = {}) {
        try {
            const canvas = this.getCanvas(canvasId);
            if (!canvas) return null;

            const ctx = canvas.getContext('2d');
            this.destroyChart(canvasId);

            const chartConfig = {
                type: 'line',
                data: {
                    labels: data.labels || [],
                    datasets: [
                        {
                            label: 'Preguntas respondidas',
                            data: data.questions || [],
                            borderColor: this.themeColors.primary,
                            backgroundColor: `${this.themeColors.primary}20`,
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: this.themeColors.primary,
                            pointBorderColor: this.themeColors.background,
                            pointBorderWidth: 2,
                            pointRadius: 5,
                            pointHoverRadius: 7,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Precisión (%)',
                            data: data.accuracy || [],
                            borderColor: '#10b981',
                            backgroundColor: '#10b98120',
                            borderWidth: 3,
                            fill: false,
                            tension: 0.4,
                            pointBackgroundColor: '#10b981',
                            pointBorderColor: this.themeColors.background,
                            pointBorderWidth: 2,
                            pointRadius: 5,
                            pointHoverRadius: 7,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: this.themeColors.text,
                                font: { size: 12 },
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            backgroundColor: this.themeColors.surface,
                            titleColor: this.themeColors.text,
                            bodyColor: this.themeColors.text,
                            borderColor: this.themeColors.grid,
                            borderWidth: 1,
                            cornerRadius: 8
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            grid: {
                                color: this.themeColors.grid,
                                lineWidth: 1
                            },
                            ticks: {
                                color: this.themeColors.textSecondary,
                                font: { size: 11 }
                            }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            grid: {
                                color: this.themeColors.grid,
                                lineWidth: 1
                            },
                            ticks: {
                                color: this.themeColors.textSecondary,
                                font: { size: 11 },
                                beginAtZero: true
                            },
                            title: {
                                display: true,
                                text: 'Preguntas',
                                color: this.themeColors.text
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            max: 100,
                            min: 0,
                            grid: {
                                drawOnChartArea: false,
                                color: this.themeColors.grid
                            },
                            ticks: {
                                color: this.themeColors.textSecondary,
                                font: { size: 11 },
                                callback: (value) => value + '%'
                            },
                            title: {
                                display: true,
                                text: 'Precisión (%)',
                                color: this.themeColors.text
                            }
                        }
                    },
                    animation: {
                        duration: 1200,
                        easing: 'easeOutQuart'
                    },
                    ...options.chartOptions
                }
            };

            const chart = new Chart(ctx, chartConfig);
            this.charts.set(canvasId, chart);
            return chart;
        } catch (error) {
            ErrorHandler.logError(error, `ChartService.createProgressChart.${canvasId}`);
            return null;
        }
    }

    createAccuracyRadarChart(canvasId, data, options = {}) {
        try {
            const canvas = this.getCanvas(canvasId);
            if (!canvas) return null;

            const ctx = canvas.getContext('2d');
            this.destroyChart(canvasId);

            const chartConfig = {
                type: 'radar',
                data: {
                    labels: data.labels || [],
                    datasets: [{
                        label: 'Precisión por Especialidad',
                        data: data.values || [],
                        backgroundColor: `${this.themeColors.primary}20`,
                        borderColor: this.themeColors.primary,
                        borderWidth: 2,
                        pointBackgroundColor: this.themeColors.primary,
                        pointBorderColor: this.themeColors.background,
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: this.themeColors.text,
                                font: { size: 12 }
                            }
                        },
                        tooltip: {
                            backgroundColor: this.themeColors.surface,
                            titleColor: this.themeColors.text,
                            bodyColor: this.themeColors.text,
                            callbacks: {
                                label: (context) => `${context.label}: ${context.parsed.r}%`
                            }
                        }
                    },
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                color: this.themeColors.textSecondary,
                                font: { size: 10 },
                                callback: (value) => value + '%',
                                stepSize: 20
                            },
                            grid: {
                                color: this.themeColors.grid
                            },
                            angleLines: {
                                color: this.themeColors.grid
                            },
                            pointLabels: {
                                color: this.themeColors.text,
                                font: { size: 11 }
                            }
                        }
                    },
                    animation: {
                        duration: 1500,
                        easing: 'easeOutElastic'
                    },
                    ...options.chartOptions
                }
            };

            const chart = new Chart(ctx, chartConfig);
            this.charts.set(canvasId, chart);
            return chart;
        } catch (error) {
            ErrorHandler.logError(error, `ChartService.createAccuracyRadarChart.${canvasId}`);
            return null;
        }
    }

    createBarChart(canvasId, data, options = {}) {
        try {
            const canvas = this.getCanvas(canvasId);
            if (!canvas) return null;

            const ctx = canvas.getContext('2d');
            this.destroyChart(canvasId);

            const chartConfig = {
                type: 'bar',
                data: {
                    labels: data.labels || [],
                    datasets: [{
                        label: options.label || 'Datos',
                        data: data.values || [],
                        backgroundColor: data.colors || this.defaultColors,
                        borderColor: data.borderColors || this.defaultColors.map(color => color),
                        borderWidth: 1,
                        borderRadius: 6,
                        borderSkipped: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: options.showLegend !== false,
                            labels: {
                                color: this.themeColors.text,
                                font: { size: 12 }
                            }
                        },
                        tooltip: {
                            backgroundColor: this.themeColors.surface,
                            titleColor: this.themeColors.text,
                            bodyColor: this.themeColors.text,
                            borderColor: this.themeColors.grid,
                            borderWidth: 1,
                            cornerRadius: 8
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: this.themeColors.grid,
                                display: false
                            },
                            ticks: {
                                color: this.themeColors.textSecondary,
                                font: { size: 11 }
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: this.themeColors.grid
                            },
                            ticks: {
                                color: this.themeColors.textSecondary,
                                font: { size: 11 }
                            }
                        }
                    },
                    animation: {
                        duration: 1000,
                        easing: 'easeOutBounce'
                    },
                    ...options.chartOptions
                }
            };

            const chart = new Chart(ctx, chartConfig);
            this.charts.set(canvasId, chart);
            return chart;
        } catch (error) {
            ErrorHandler.logError(error, `ChartService.createBarChart.${canvasId}`);
            return null;
        }
    }

    // Chart Management
    updateChart(canvasId, newData, options = {}) {
        const chart = this.charts.get(canvasId);
        if (!chart) {
            console.warn(`Chart ${canvasId} not found for update`);
            return false;
        }

        try {
            // Update data
            if (newData.labels) {
                chart.data.labels = newData.labels;
            }
            
            if (newData.datasets) {
                chart.data.datasets = newData.datasets;
            } else if (newData.values) {
                chart.data.datasets[0].data = newData.values;
            }

            // Update options if provided
            if (options.chartOptions) {
                Object.assign(chart.options, options.chartOptions);
            }

            // Animate the update
            chart.update(options.animation !== false ? 'active' : 'none');
            return true;
        } catch (error) {
            ErrorHandler.logError(error, `ChartService.updateChart.${canvasId}`);
            return false;
        }
    }

    destroyChart(canvasId) {
        const chart = this.charts.get(canvasId);
        if (chart) {
            chart.destroy();
            this.charts.delete(canvasId);
        }
    }

    refreshChart(canvasId) {
        const chart = this.charts.get(canvasId);
        if (chart) {
            chart.update();
        }
    }

    refreshAllCharts() {
        this.charts.forEach((chart, canvasId) => {
            try {
                // Update theme colors for all charts
                this.applyThemeToChart(chart);
                chart.update('none'); // Update without animation for theme change
            } catch (error) {
                ErrorHandler.logError(error, `ChartService.refreshAllCharts.${canvasId}`);
            }
        });
    }

    applyThemeToChart(chart) {
        // Update text colors
        if (chart.options.plugins && chart.options.plugins.legend) {
            chart.options.plugins.legend.labels.color = this.themeColors.text;
        }
        
        if (chart.options.plugins && chart.options.plugins.tooltip) {
            Object.assign(chart.options.plugins.tooltip, {
                backgroundColor: this.themeColors.surface,
                titleColor: this.themeColors.text,
                bodyColor: this.themeColors.text,
                borderColor: this.themeColors.grid
            });
        }

        // Update scale colors
        if (chart.options.scales) {
            Object.values(chart.options.scales).forEach(scale => {
                if (scale.ticks) {
                    scale.ticks.color = this.themeColors.textSecondary;
                }
                if (scale.grid) {
                    scale.grid.color = this.themeColors.grid;
                }
                if (scale.title) {
                    scale.title.color = this.themeColors.text;
                }
                if (scale.pointLabels) { // For radar charts
                    scale.pointLabels.color = this.themeColors.text;
                }
                if (scale.angleLines) { // For radar charts
                    scale.angleLines.color = this.themeColors.grid;
                }
            });
        }
    }

    // Utility Methods
    getCanvas(canvasId) {
        const canvas = typeof canvasId === 'string' 
            ? document.getElementById(canvasId)
            : canvasId;
            
        if (!canvas) {
            console.warn(`Canvas element ${canvasId} not found`);
            return null;
        }
        
        return canvas;
    }

    getAllCharts() {
        return Array.from(this.charts.entries()).map(([id, chart]) => ({
            id,
            chart,
            type: chart.config.type,
            data: chart.data
        }));
    }

    exportChart(canvasId, format = 'png') {
        const chart = this.charts.get(canvasId);
        if (!chart) {
            console.warn(`Chart ${canvasId} not found for export`);
            return null;
        }

        try {
            return chart.toBase64Image(format);
        } catch (error) {
            ErrorHandler.logError(error, `ChartService.exportChart.${canvasId}`);
            return null;
        }
    }

    downloadChart(canvasId, filename = 'chart') {
        const base64Image = this.exportChart(canvasId);
        if (!base64Image) return;

        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = base64Image;
        link.click();
    }

    // Specialized Chart Builders
    buildSpecialtyPerformanceChart(canvasId, categoryStats) {
        const data = {
            labels: categoryStats.map(cat => cat.name),
            values: categoryStats.map(cat => cat.total),
            accuracies: categoryStats.map(cat => cat.accuracy)
        };

        return this.createSpecialtyChart(canvasId, data, {
            legendPosition: 'right'
        });
    }

    buildProgressTrendChart(canvasId, dailyProgress) {
        const last30Days = dailyProgress.slice(-30);
        
        const data = {
            labels: last30Days.map(d => this.formatDateForChart(d.date)),
            questions: last30Days.map(d => d.questions),
            accuracy: last30Days.map(d => d.accuracy)
        };

        return this.createProgressChart(canvasId, data);
    }

    buildAccuracyOverviewChart(canvasId, categoryStats) {
        const data = {
            labels: categoryStats.map(cat => cat.name),
            values: categoryStats.map(cat => cat.accuracy)
        };

        return this.createAccuracyRadarChart(canvasId, data);
    }

    // Data Processing Helpers
    formatDateForChart(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { 
            month: 'short', 
            day: 'numeric' 
        });
    }

    processSessionDataForChart(sessions, timeframe = 30) {
        const now = new Date();
        const cutoffDate = new Date(now.getTime() - (timeframe * 24 * 60 * 60 * 1000));
        
        const recentSessions = sessions.filter(session => 
            new Date(session.startTime) >= cutoffDate
        );

        // Group by day
        const dailyData = {};
        recentSessions.forEach(session => {
            const date = new Date(session.startTime).toISOString().split('T')[0];
            if (!dailyData[date]) {
                dailyData[date] = {
                    questions: 0,
                    correct: 0,
                    sessions: 0
                };
            }
            
            dailyData[date].questions += session.summary?.totalQuestions || 0;
            dailyData[date].correct += session.summary?.correctAnswers || 0;
            dailyData[date].sessions++;
        });

        // Convert to chart data
        const sortedDates = Object.keys(dailyData).sort();
        return sortedDates.map(date => ({
            date,
            questions: dailyData[date].questions,
            accuracy: dailyData[date].questions > 0 
                ? Math.round((dailyData[date].correct / dailyData[date].questions) * 100)
                : 0,
            sessions: dailyData[date].sessions
        }));
    }

    // Cleanup
    destroy() {
        this.charts.forEach((chart, canvasId) => {
            this.destroyChart(canvasId);
        });
        this.charts.clear();
    }
}

// Create singleton instance
const chartService = new ChartService();

// Export as global
window.ChartService = chartService;

// For module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = chartService;
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    chartService.destroy();
});