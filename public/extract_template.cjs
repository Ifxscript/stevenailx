// Extract the template from the bundled HTML file
const fs = require('fs');

const html = fs.readFileSync('/Users/APPLE/Downloads/stevenailx/public/Booking Redesign (1).html', 'utf8');

// Extract template
const templateMatch = html.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/);
if (templateMatch) {
  const template = JSON.parse(templateMatch[1]);
  fs.writeFileSync('/Users/APPLE/Downloads/stevenailx/public/extracted_template.html', template);
  console.log('Template extracted successfully!');
  console.log('Template length:', template.length);
  // Show first 5000 chars
  console.log('\n--- TEMPLATE PREVIEW (first 5000 chars) ---\n');
  console.log(template.substring(0, 5000));
  console.log('\n--- END PREVIEW ---\n');
  console.log('\n--- TEMPLATE TAIL (last 3000 chars) ---\n');
  console.log(template.substring(template.length - 3000));
} else {
  console.log('No template found');
}
