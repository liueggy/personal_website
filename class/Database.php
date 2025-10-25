<?php
/**
 * 数据库连接类（单例模式）
 * 路径：/www/wwwroot/liueggy.live/class/Database.php
 */

class Database {
    private static $instance = null;
    private $connection = null;
    private $config = null;

    private function __construct() {
        $configFile = __DIR__ . '/../config/database.php';
        if (!file_exists($configFile)) {
            throw new Exception('数据库配置文件不存在');
        }
        $this->config = require $configFile;
        $this->connect();
    }

    private function connect() {
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=%s',
            $this->config['host'],
            $this->config['port'],
            $this->config['database'],
            $this->config['charset']
        );

        try {
            $this->connection = new PDO(
                $dsn,
                $this->config['username'],
                $this->config['password'],
                $this->config['options']
            );
        } catch (PDOException $e) {
            throw new Exception('数据库连接失败: ' . $e->getMessage());
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->connection;
    }

    /**
     * 执行查询（SELECT）
     */
    public function query($sql, $params = []) {
        $stmt = $this->connection->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * 执行单行查询
     */
    public function queryOne($sql, $params = []) {
        $stmt = $this->connection->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetch();
    }

    /**
     * 执行更新/插入/删除
     * 返回受影响的行数
     */
    public function execute($sql, $params = []) {
        $stmt = $this->connection->prepare($sql);
        $stmt->execute($params);
        return $stmt->rowCount(); // 返回受影响的行数
    }

    /**
     * 获取最后插入的ID
     */
    public function lastInsertId() {
        return $this->connection->lastInsertId();
    }

    /**
     * 开启事务
     */
    public function beginTransaction() {
        return $this->connection->beginTransaction();
    }

    /**
     * 提交事务
     */
    public function commit() {
        return $this->connection->commit();
    }

    /**
     * 回滚事务
     */
    public function rollback() {
        return $this->connection->rollBack();
    }

    // 禁止克隆和反序列化
    private function __clone() {}
    public function __wakeup() {
        throw new Exception("不允许反序列化单例");
    }
}
