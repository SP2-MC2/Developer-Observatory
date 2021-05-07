urlPlaceHolder="%landingURL%"
skippedUrlPlaceHolder="%skippedTaskSurveyURL%"
taskCountPlaceHolder="%taskCount%"

cp config/app.py config/compiled_app.py

# Python services
sed -i "s|$urlPlaceHolder|$landingURL|g" config/compiled_app.py

# Notebook files
cp config/custom.js nb_template/
sed -i "s|$urlPlaceHolder|$landingURL|g" nb_template/custom.js
sed -i "s|$skippedUrlPlaceHolder|$skippedTaskSurveyURL|g" nb_template/custom.js
sed -i "s|$taskCountPlaceHolder|$taskCount|g" nb_template/custom.js
