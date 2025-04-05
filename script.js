class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.isDarkMode = localStorage.getItem('darkMode') === 'true';
        this.setupEventListeners();
        this.updateUI();
        this.initializeTheme();
    }

    initializeTheme() {
        if (this.isDarkMode) {
            document.body.classList.add('dark-theme');
            document.querySelector('.theme-toggle').textContent = '☀️';
        }
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Theme toggle
        document.querySelector('.theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Filter changes
        document.getElementById('categoryFilter').addEventListener('change', () => this.filterTasks());
        document.getElementById('priorityFilter').addEventListener('change', () => this.filterTasks());
    }

    addTask() {
        const task = {
            id: Date.now(),
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            category: document.getElementById('taskCategory').value,
            priority: document.getElementById('taskPriority').value,
            dueDate: document.getElementById('taskDueDate').value,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveTasks();
        this.updateUI();
        document.getElementById('taskForm').reset();
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.saveTasks();
        this.updateUI();
    }

    toggleTaskCompletion(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.updateUI();
        }
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        document.body.classList.toggle('dark-theme');
        document.querySelector('.theme-toggle').textContent = this.isDarkMode ? '☀️' : '🌙';
        localStorage.setItem('darkMode', this.isDarkMode);
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    filterTasks() {
        const categoryFilter = document.getElementById('categoryFilter').value;
        const priorityFilter = document.getElementById('priorityFilter').value;

        let filteredTasks = [...this.tasks];

        if (categoryFilter !== 'All') {
            filteredTasks = filteredTasks.filter(task => task.category === categoryFilter);
        }
        if (priorityFilter !== 'All') {
            filteredTasks = filteredTasks.filter(task => task.priority === priorityFilter);
        }

        this.renderTasks(filteredTasks);
    }

    updateUI() {
        this.updateStats();
        this.updateFilters();
        this.renderTasks(this.tasks);
    }

    updateStats() {
        const activeTasks = this.tasks.filter(task => !task.completed).length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const highPriorityTasks = this.tasks.filter(task => task.priority === 'High').length;

        document.getElementById('activeTasks').textContent = activeTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
        document.getElementById('highPriorityTasks').textContent = highPriorityTasks;
    }

    updateFilters() {
        const categories = ['All', ...new Set(this.tasks.map(task => task.category))];
        const priorities = ['All', ...new Set(this.tasks.map(task => task.priority))];

        const categoryFilter = document.getElementById('categoryFilter');
        const priorityFilter = document.getElementById('priorityFilter');

        categoryFilter.innerHTML = categories.map(category => 
            `<option value="${category}">${category}</option>`
        ).join('');

        priorityFilter.innerHTML = priorities.map(priority => 
            `<option value="${priority}">${priority}</option>`
        ).join('');
    }

    renderTasks(tasksToRender) {
        const tasksList = document.getElementById('tasksList');
        tasksList.innerHTML = '';

        tasksToRender.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = `task-item ${task.category.toLowerCase().replace(' ', '-')} ${task.completed ? 'completed' : ''}`;
            
            taskElement.innerHTML = `
                <div class="task-header">
                    <h3 class="task-title">${task.title}</h3>
                    <span class="task-category ${task.category.toLowerCase().replace(' ', '-')}">${task.category}</span>
                </div>
                <p class="task-description">${task.description}</p>
                <div class="task-meta">
                    <span>Due in ${this.calculateDueDate(task.dueDate)}</span>
                    <div class="task-actions">
                        <button onclick="taskManager.toggleTaskCompletion(${task.id})">
                            ${task.completed ? '↩️' : '✓'}
                        </button>
                        <button onclick="taskManager.deleteTask(${task.id})">🗑️</button>
                        <button onclick="openEditModal(${task.id})" class="edit-btn">✏️ Editar</button>
                    </div>
                </div>
            `;
            
            tasksList.appendChild(taskElement);
        });
    }

    calculateDueDate(dueDate) {
        const days = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
        if (days < 0) return 'Overdue';
        if (days === 0) return 'Today';
        if (days === 1) return '1 day';
        return `${days} days`;
    }

    editTask(taskId, updatedTask) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updatedTask };
            this.saveTasks();
            this.updateUI();
        }
    }

    exportToCSV() {
        if (this.tasks.length === 0) {
            alert('Não há tarefas para exportar!');
            return;
        }

        // Define CSV headers
        const headers = ['Título', 'Descrição', 'Categoria', 'Prioridade', 'Data de Entrega', 'Status'];
        
        // Convert tasks to CSV format
        const csvContent = [
            headers.join(','),
            ...this.tasks.map(task => [
                this.escapeCsvField(task.title),
                this.escapeCsvField(task.description),
                this.escapeCsvField(task.category),
                this.escapeCsvField(task.priority),
                this.escapeCsvField(task.dueDate),
                this.escapeCsvField(task.completed ? 'Completa' : 'Pendente')
            ].join(','))
        ].join('\n');

        // Create blob and download link
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        // Set download attributes
        link.setAttribute('href', url);
        link.setAttribute('download', `tarefas_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.display = 'none';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    escapeCsvField(field) {
        // Handle null or undefined fields
        if (field === null || field === undefined) {
            return '';
        }
        
        // Convert to string and escape special characters
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
            return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
    }
}

// ThemeManager class
class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
        this.root = document.documentElement;
        this.currentTheme = localStorage.getItem('theme') || 'dark';
        
        this.initialize();
        this.setupEventListeners();
    }

    initialize() {
        this.root.setAttribute('data-theme', this.currentTheme);
        this.updateToggleButton();
    }

    setupEventListeners() {
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.root.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
        this.updateToggleButton();
    }

    updateToggleButton() {
        const icon = this.themeToggle.querySelector('.theme-icon');
        const status = this.themeToggle.querySelector('.theme-status');
        
        if (this.currentTheme === 'dark') {
            icon.textContent = '🌙';
            status.textContent = 'Modo Escuro';
        } else {
            icon.textContent = '☀️';
            status.textContent = 'Modo Claro';
        }
    }
}

// PomodoroTimer class
class PomodoroTimer {
    constructor() {
        this.timeLeft = 1500; // 25 minutes in seconds
        this.workTime = 1500;
        this.breakTime = 300;
        this.isRunning = false;
        this.isBreak = false;
        this.timerId = null;
        
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        this.timerDisplay = document.getElementById('timerDisplay');
        this.startButton = document.getElementById('startTimer');
        this.pauseButton = document.getElementById('pauseTimer');
        this.resetButton = document.getElementById('resetTimer');
        this.timerPhase = document.querySelector('.timer-phase');
        this.presetButtons = document.querySelectorAll('.preset-btn');
        this.customButton = document.getElementById('customTimerBtn');
    }

    setupEventListeners() {
        this.startButton.addEventListener('click', () => this.startTimer());
        this.pauseButton.addEventListener('click', () => this.pauseTimer());
        this.resetButton.addEventListener('click', () => this.resetTimer());
        
        this.presetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.workTime = parseInt(btn.dataset.work) * 60;
                this.breakTime = parseInt(btn.dataset.break) * 60;
                this.resetTimer();
            });
        });

        this.customButton.addEventListener('click', () => this.showCustomTimerDialog());
    }

    startTimer() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.startButton.disabled = true;
            this.pauseButton.disabled = false;
            
            this.timerId = setInterval(() => {
                this.timeLeft--;
                this.updateDisplay();
                
                if (this.timeLeft === 0) {
                    this.playNotification();
                    this.togglePhase();
                }
            }, 1000);
        }
    }

    pauseTimer() {
        clearInterval(this.timerId);
        this.isRunning = false;
        this.startButton.disabled = false;
        this.pauseButton.disabled = true;
    }

    resetTimer() {
        this.pauseTimer();
        this.timeLeft = this.workTime;
        this.isBreak = false;
        this.updateDisplay();
        this.timerPhase.textContent = 'Foco';
    }

    togglePhase() {
        this.isBreak = !this.isBreak;
        this.timeLeft = this.isBreak ? this.breakTime : this.workTime;
        this.timerPhase.textContent = this.isBreak ? 'Pausa' : 'Foco';
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timerDisplay.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    showCustomTimerDialog() {
        const workTime = prompt('Tempo de foco (minutos):', '25');
        const breakTime = prompt('Tempo de pausa (minutos):', '5');
        
        if (workTime && breakTime) {
            this.workTime = parseInt(workTime) * 60;
            this.breakTime = parseInt(breakTime) * 60;
            this.resetTimer();
        }
    }

    playNotification() {
        const audio = new Audio('data:audio/wav;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7xA4Tvh9Rz/y8QADBwMWgQAZG/ILNAARQ4GLTcDeIIIhxGOBAuD7hOfBB3/94gcJ3w+o5/5eIAIAAAVwWgQAVQ2ORaIQwEMAJiDg95G4nQL7mQVWI6GwRcfsZAcsKkJvxgxEjzFUgfHoSQ9Qq7KNwqHwuB13MA4a1q/DmBrHgPcmjiGoh//EwC5nGPEmS4RcfkVKOhJf+WOgoxJclFz3kgn//dBA+ya1GhurNn8zb//9NNutNuhz31f////9vt///z+IdAEAAAK4LQIAKobHItEIYCGAExBwe8jcToF9zIKrEdDYIuP2MgOWFSE34wYiR5iqQPj0JIeoVdlG4VD4XA67mAcNa1fhzA1jwHuTRxDUQ//iYBczjHiTJcIuPyKlHQkv/LHQUYkuSi57yQT//uggfZNajQ3Vmz+Zt//+mm3Wm3Q576v////+32///5/EOgAAADVghQAAAAA//uQZAUAB1WI0PZugAAAAAoQwAAAEk3nRd2qAAAAACiDgAAAAAAABCqEEQRLCgwpBGMlJkIz8jKhGvj4k6jzRnqasNKIeoh5gI7BJaC1A1AoNBjJgbyApVS4IDlZgDU5WUAxEKDNmmALHzZp0Fkz1FMTmGFl1FMEyodIavcCAUHDWrKAIA4aa2oCgILEBupZgHvAhEBcZ6joQBxS76AgccrFlczBvKLC0QI2cBoCFvfTDAo7eoOQInqDPBtvrDEZBNYN5xwNwxQRfw8ZQ5wQVLvO8OYU+mHvFLlDh05Mdg7BT6YrRPpCBznMB2r//xKJjyyOh+cImr2/4doscwD6neZjuZR4AgAABYAAAABy1xcdQtxYBYYZdifkUDgzzXaXn98Z0oi9ILU5mBjFANmRwlVJ3/6jYDAmxaiDG3/6xjQQCCKkRb/6kg/wW+kSJ5//rLobkLSiKmqP/0ikJuDaSaSf/6JiLYLEYnW/+kXg1WRVJL/9EmQ1YZIsv/6Qzwy5qk7/+tEU0nkls3/zIUMPKNX/6yZLf+kFgAfgGyLFAUwY//uQZAUABcd5UiNPVXAAAApAAAAAE0VZQ');
        audio.play();
    }
}

// Initialize the task manager
const taskManager = new TaskManager();

// Initialize the theme manager
const themeManager = new ThemeManager();

// Initialize the Pomodoro timer
const pomodoroTimer = new PomodoroTimer();

function openEditModal(taskId) {
    const modal = document.getElementById('editTaskModal');
    const task = taskManager.tasks.find(t => t.id === taskId);
    
    if (task) {
        document.getElementById('editTaskTitle').value = task.title;
        document.getElementById('editTaskDescription').value = task.description;
        document.getElementById('editTaskCategory').value = task.category;
        document.getElementById('editTaskPriority').value = task.priority;
        document.getElementById('editTaskDueDate').value = task.dueDate;
        
        modal.style.display = 'block';
        
        const editForm = document.getElementById('editTaskForm');
        editForm.onsubmit = (e) => {
            e.preventDefault();
            
            const updatedTask = {
                title: document.getElementById('editTaskTitle').value,
                description: document.getElementById('editTaskDescription').value,
                category: document.getElementById('editTaskCategory').value,
                priority: document.getElementById('editTaskPriority').value,
                dueDate: document.getElementById('editTaskDueDate').value
            };
            
            taskManager.editTask(taskId, updatedTask);
            modal.style.display = 'none';
        };
    }
}

document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('editTaskModal').style.display = 'none';
});

window.addEventListener('click', (event) => {
    const modal = document.getElementById('editTaskModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const exportBtn = document.getElementById('exportCSV');
    exportBtn.addEventListener('click', () => taskManager.exportToCSV());
});
