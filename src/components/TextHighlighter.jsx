import React, { useState, useEffect, useRef } from 'react';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { HexColorPicker } from 'react-colorful';

const FLUORESCENT_COLORS = {
    yellow: '#ffff00',
    green: '#39ff14',
    pink: '#ff1493',
    orange: '#ff6700',
    blue: '#00ffff'
};

const TextHighlighter = ({ children }) => {
    const [highlights, setHighlights] = useState([]);
    const [showButton, setShowButton] = useState(false);
    const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
    const [selectedText, setSelectedText] = useState('');
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [currentColor, setCurrentColor] = useState(FLUORESCENT_COLORS.yellow);
    const containerRef = useRef(null);
    const colorPickerRef = useRef(null);

    useEffect(() => {
        const handleMouseUp = () => {
            const selection = window.getSelection();
            const text = selection.toString().trim();

            if (text && containerRef.current?.contains(selection.anchorNode)) {
                setSelectedText(text);
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                const containerRect = containerRef.current.getBoundingClientRect();

                setButtonPosition({
                    x: rect.left + (rect.width / 2) - containerRect.left,
                    y: rect.top - containerRect.top - 50
                });
                setShowButton(true);
            } else {
                setShowButton(false);
                setShowColorPicker(false);
            }
        };

        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousedown', (e) => {
            if (!colorPickerRef.current?.contains(e.target)) {
                setShowColorPicker(false);
            }
        });

        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousedown', handleMouseUp);
        };
    }, []);

    const handleHighlight = () => {
        if (selectedText) {
            const newHighlight = {
                text: selectedText,
                color: currentColor + '80' // Adding 50% opacity
            };
            setHighlights(prev => [...prev, newHighlight]);
            setShowButton(false);
            setSelectedText('');
            window.getSelection().removeAllRanges();
        }
    };

    const processContent = (content) => {
        if (!content || !highlights.length) return content;

        let processedContent = content;
        highlights.forEach(({ text, color }) => {
            const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escapedText})`, 'gi');
            processedContent = processedContent.replace(regex, `<mark style="background-color: ${color}">$1</mark>`);
        });
        return processedContent;
    };

    const content = children?.props?.children || '';
    const processedContent = processContent(content);

    return (
        <div className="text-highlighter" ref={containerRef}>
            <div 
                className="highlightable-content"
                dangerouslySetInnerHTML={{ __html: processedContent }}
            />

            {showButton && (
                <div
                    className="highlight-tooltip"
                    style={{
                        position: 'absolute',
                        left: `${buttonPosition.x}px`,
                        top: `${buttonPosition.y}px`,
                        transform: 'translate(-50%, -100%)',
                        zIndex: 1000
                    }}
                >
                    <div className="highlight-button-container">
                        <button
                            className="highlight-button"
                            onClick={handleHighlight}
                            title="Highlight text"
                        >
                            <PencilSquareIcon className="w-5 h-5" />
                            <span>Highlight</span>
                        </button>
                        <button
                            className="color-picker-toggle"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowColorPicker(!showColorPicker);
                            }}
                            style={{ backgroundColor: currentColor }}
                            title="Choose color"
                        />
                    </div>

                    {showColorPicker && (
                        <div className="color-picker-panel" ref={colorPickerRef}>
                            <div className="preset-colors">
                                {Object.entries(FLUORESCENT_COLORS).map(([name, color]) => (
                                    <button
                                        key={color}
                                        className="color-preset"
                                        style={{ backgroundColor: color }}
                                        onClick={() => {
                                            setCurrentColor(color);
                                            setShowColorPicker(false);
                                        }}
                                        title={name}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TextHighlighter; 