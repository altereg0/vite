import chalk from 'chalk';

export const debug = (message?: any, ...optionalParams: any[]) => {
    console.log(chalk.blue(`[DEBUG] ${message}`), ...optionalParams);
};

export const info = (message?: any, ...optionalParams: any[]) => {
    console.log(chalk.green(`[INFO] ${message}`), ...optionalParams);
};

export const warn = (message?: any, ...optionalParams: any[]) => {
    console.log(chalk.yellow(`[WARN] ${message}`), ...optionalParams);
};

export const error = (message?: any, ...optionalParams: any[]) => {
    console.log(chalk.red(`[ERROR] ${message}`), ...optionalParams);
};
