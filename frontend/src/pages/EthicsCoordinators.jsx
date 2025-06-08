// frontend/src/pages/EthicsCoordinators.jsx

import React from 'react';

const EthicsCoordinators = () => {
  const pageStyle = {
    padding: '40px',
    maxWidth: '800px',
    margin: '40px auto',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    lineHeight: '1.8',
    color: '#333',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    direction: 'rtl', // Right-to-left for Hebrew
    textAlign: 'right', // Align text to the right for Hebrew
  };

  const headingStyle = {
    fontSize: '2.5rem',
    color: '#2c3e50',
    marginBottom: '25px',
    textAlign: 'center',
    borderBottom: '2px solid #e0e0e0',
    paddingBottom: '15px',
  };

  const subHeadingStyle = {
    fontSize: '1.8rem',
    color: '#34495e',
    marginTop: '30px',
    marginBottom: '15px',
    textAlign: 'center',
  };

  const sectionHeadingStyle = {
    fontSize: '1.6rem',
    color: '#34495e',
    marginTop: '30px',
    marginBottom: '15px',
    borderBottom: '1px dashed #cccccc',
    paddingBottom: '5px',
  };

  const paragraphStyle = {
    marginBottom: '15px',
    fontSize: '1.05rem',
  };

  const ulStyle = {
    listStyleType: 'decimal',
    marginLeft: '20px',
    marginBottom: '20px',
    fontSize: '1.05rem',
    paddingRight: '20px', // Adjust for RTL list numbers
  };

  const liStyle = {
    marginBottom: '10px',
  };

  return (
    <div style={pageStyle}>
      <h1 style={headingStyle}>כללי אתיקה של רכזים בעמותת "מגן דבורים אדום"</h1>
      <h2 style={subHeadingStyle}>תודה והוקרה</h2>
      <p style={paragraphStyle}>
        לרכזות ורכזים יקרות ויקרים, תודה על התנדבותכן/ם כרכזים. תפקיד רכז/ת פניות הוא עיסוק התנדבותי בעל משמעות רבה ולא כל כך פשוט, וההתנדבות שלכן/ם ראויה לציון ולהוקרה.
      </p>
      <p style={paragraphStyle}>
        פעולתו של הרכז/ת כה משמעותית שלפעמים היא יכולה לקבוע את גורלו של הנחיל, האם הוא ינצל או שירוסס. תודה לך על פועלך/ה.
      </p>
      <p style={paragraphStyle}>
        הטופס השנה דומה לשנה שעברה, הדבר היחידי שהוספנו בו הוא ההתחייבות לרכז/ת לא להיות פעיל/ה בגוף או קבוצה שמפנה נחילים תמורת תשלום.
      </p>

      <h2 style={sectionHeadingStyle}>כללי האתיקה</h2>
      <ul style={ulStyle}>
        <li style={liStyle}>
          הרכז/ת והמציל/ה יעשו כל מאמץ סביר על מנת להשאיר את הנחיל לחיות בדו-קיום במקומו (בעיקר בנחילי קבע) וייעזרו לשם כך בחבריהם.
        </li>
        <li style={liStyle}>
          הרכז/ת והמציל/ה יעשו כל פעולה סבירה על מנת שהנחיל יועבר במקצועיות ובחמלה למקומו החדש.
        </li>
        <li style={liStyle}>
          נחיל שצריך לפנות מגזע עץ לכריתה, יעשה מאמץ לכרות את העץ עם הנחיל בתוכו ולהעבירו לחוות חופש, או למקום אחר לחיות בחופש בתוך הגזע המקורי.
        </li>
        <li style={liStyle}>
          הרכז/ת והמציל/ה (כמו כל הפעילים בעמותה) מתנדבים התנדבות מלאה. אין בשום מקרה לגבות כל סכום כסף! לא הוצאות נסיעה ואחרות מהמזמינים להצלה או מכל גורם אחר.
        </li>
        <li style={liStyle}>
          ברור לרכז/ת שכשאנו מצילים נחיל (של קבע), בו בזמן אנו פולשים לרקמת חייו (למקום בו הוא התנחל), מפרקים לו את חלות הדונג, מפזרים את חום הגוף שלו, מפזרים את הפרומון של המלכה, מנתקים אותו מהפרופוליס שייצר, פוגעים בתהליכי ההתפתחות (ביצים זחל, גולם), הורגים לפעמים מספר רב של דבורים, גורמים סטרס עצום (תעוקה) לדבורים-למלכה ולנחיל כולו. את כל זה עלינו לעשות בלית ברירה בכדי להציל אותו.
        </li>
        <li style={liStyle}>
          אסור למכור נחיל שהוצל! יש לתת לו זמן להשתקם ולהחלים מטראומת הניתוק ממהלך חייו הטבעי.
        </li>
        <li style={liStyle}>
          הרכז/ת והמציל/ה ינהגו בכבוד ובחמלה כלפי הנחיל כמו שראוי לנהוג עם כל בעל חיים במצוקה.
        </li>
        <li style={liStyle}>
          הרכז/ת יפרסם/ת את הנחילים בקבוצות הקשר של עמותת מגן דבורים אדום בלבד (לא באף קבוצת מצילים או מפנים אחרת).
        </li>
        <li style={liStyle}>
          הרכז/ת והמציל/ה ינהגו בתודעת שירות כלפי "המדווחים", ירגיעו אותם ויעזרו להם להתיידד עם הנחיל ועם הסיטואציה.
        </li>
        <li style={liStyle}>
          באחריות הרכז/ת והמציל/ה לדווח על גמר ביצוע ההצלה "סגירת דיווח" ומידת הצלחתה.
        </li>
        <li style={liStyle}>
          קבוצת הרכזים, צוות העמותה והמצילים מהווים קבוצת למידה להתייעלות ולשיפור וכן לעזרה ולתמיכה בין המצילים.
        </li>
        <li style={liStyle}>
          ידוע לרכז/ת ולמציל/ה שהוא/היא פועל/ת בהתנדבות מלאה כמתנדב/ת עצמאי/ת. אין כל יחסי עובד מעביד או כל יחסי מרות ו/או תלות אחרת בין העמותה ובין הרכזים והמתנדבים העצמאיים.
        </li>
        <li style={liStyle}>
          מצילים חסרי ניסיון יעברו הדרכה ו/או יתלוו למצילים ותיקים לשם התנסות ולימוד.
        </li>
        <li style={liStyle}>
          מתנדבי העמותה המצילים והרכזים יפגשו לפגישת תיאום ציפיות בתחילת העונה (יתקיים בזום במידה ויהיו הגבלות התכנסות-קורונה).
        </li>
        <li style={liStyle}>
          הרכזים יפגשו לפגישת הכנת העונה ואם יהיה צורך במהלך העונה גם כן (יתקיים בזום במידה ויהיו הגבלות התכנסות-קורונה).
        </li>
        <li style={liStyle}>
          ידוע לי שההתנדבות כרכז/ת תתאפשר לאחר החתימה על כללי האתיקה וההתנדבות.
        </li>
        <li style={liStyle}>
          ידוע לי שהתנדבות כרכז/ת בעמותת מגן דבורים אדום לא מאפשרת לי להיות חלק מקבוצות העוסקות בפינוי/הצלת נחילים בתשלום.
        </li>
      </ul>
      <p style={paragraphStyle}>
        אנו מודים לכם/ן על מחויבותכם/ן לכללים אלו, ועל הצטרפותכם/ן למשפחת "מגן דבורים אדום". בזכותכם/ן, נוכל להמשיך לסייע לקהילה ולדבורים בישראל.
      </p>
    </div>
  );
};

export default EthicsCoordinators;