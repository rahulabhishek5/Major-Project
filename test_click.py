from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import time
import json

options = Options()
options.add_argument('--headless')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

driver = webdriver.Chrome(options=options)
driver.get("http://localhost:3000")
time.sleep(2)

# Navigate to policy
driver.execute_script("window.AppCore.App.navigate('policy'); window.AppCore.Views.policy.selectedId='POL-DP-001'; window.AppCore.Views.policy.render(document.getElementById('view-container'));")
time.sleep(1)

print("Before clicking, sections length:", driver.execute_script("return window.AppCore.StateManager.getByPath('policies').find(p => p.policy_id === 'POL-DP-001').sections.length"))

# Click button
driver.execute_script("window.AppCore.Views.policy.addManualClause('POL-DP-001')")
time.sleep(2)

print("After clicking, sections length:", driver.execute_script("return window.AppCore.StateManager.getByPath('policies').find(p => p.policy_id === 'POL-DP-001').sections.length"))

logs = driver.get_log('browser')
for log in logs:
    print(log)

driver.quit()
