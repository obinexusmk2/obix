import { 
    createVirtualStylesheet, 
    createRule, 
    createAtRule 
  } from 'obix/parser/css/vcss';
  
  // Create a virtual stylesheet
  const stylesheet = createVirtualStylesheet(`
    .header {
      background-color: #333;
      color: white;
      padding: 20px;
    }
    
    .content {
      margin: 20px;
      font-size: 16px;
    }
  `, {
    applyOptimizations: true,
    autoPatch: true
  });
  
  // Add a new rule
  stylesheet.addRule('.button', {
    'background-color': 'blue',
    'color': 'white',
    'padding': '10px 15px',
    'border-radius': '4px'
  });
  
  // Update an existing rule
  stylesheet.updateRule('.header', {
    'background-color': '#444',
    'color': 'white',
    'padding': '20px',
    'box-shadow': '0 2px 4px rgba(0,0,0,0.2)'
  });
  
  // Add a media query
  const mediaBlock = createRule('.content', {
    'font-size': '18px',
    'line-height': '1.6'
  });
  
  stylesheet.addAtRule('media', 'screen and (min-width: 768px)', mediaBlock);
  
  // Remove a rule
  stylesheet.removeRule('.button');
  
  // Get performance metrics
  const metrics = stylesheet.getMetrics();
  console.log('Performance metrics:', metrics);