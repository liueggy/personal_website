<?php
/**
 * 敏感词过滤类
 * 路径：/www/wwwroot/liueggy.live/class/SensitiveWord.php
 */

class SensitiveWord {
    private $wordList = [];
    private $wordFile;
    
    public function __construct($wordFile = null) {
        $this->wordFile = $wordFile ?: __DIR__ . '/../data/sensitive_words.txt';
        $this->loadWords();
    }
    
    private function loadWords() {
        if (file_exists($this->wordFile)) {
            $content = file_get_contents($this->wordFile);
            $this->wordList = array_filter(array_map('trim', explode("\n", $content)));
        } else {
            // 默认敏感词列表
            $this->wordList = [
                '傻逼', '操你妈', '草泥马', '尼玛', '妈的',
                'fuck', 'shit', 'bitch', 
                '黄色', '赌博', '色情', '暴力',
                '法轮功', '共产党'
            ];
        }
    }
    
    /**
     * 检查文本是否包含敏感词
     */
    public function check($text) {
        $text = strtolower($text);
        foreach ($this->wordList as $word) {
            if (stripos($text, $word) !== false) {
                return ['found' => true, 'word' => $word];
            }
        }
        return ['found' => false, 'word' => null];
    }
    
    /**
     * 替换敏感词为星号
     */
    public function filter($text) {
        foreach ($this->wordList as $word) {
            $replacement = str_repeat('*', mb_strlen($word));
            $text = str_ireplace($word, $replacement, $text);
        }
        return $text;
    }
    
    /**
     * 添加敏感词
     */
    public function addWord($word) {
        if (!in_array($word, $this->wordList)) {
            $this->wordList[] = $word;
            $this->saveWords();
        }
    }
    
    /**
     * 保存敏感词到文件
     */
    private function saveWords() {
        file_put_contents($this->wordFile, implode("\n", $this->wordList));
    }
}
