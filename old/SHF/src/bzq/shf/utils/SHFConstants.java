/*
 * Created on 29/12/2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.utils;

import java.util.HashMap;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class SHFConstants {
	public static final String APP_ERROR_PREFIX = "shf";
	
	public final static String TEAM_UNIT="J01";
	public final static String MOKED_UNIT="G01";
	public final static String AGAF_UNIT="E01";
	public final static String HATIVA_UNIT="A01";

	public final static int MISSING_REASON=1;
	public final static int LATE_REASON=2;
	public final static int CHANGE_SHIFT_REASON=3;	
	public final static int EVENT_TYPE=4;
	public final static int STAGE_LATE_REASON=5;
	public final static int BREAK_LATE=6;
	public final static int EARLY_EXIT=7;
	public final static int CANCEL_SHIFT=8;
	
	
	
	public final static HashMap EVENT_DESC_MAP = new HashMap();
	static	{
		EVENT_DESC_MAP.put("1","חיסור");
		EVENT_DESC_MAP.put("2","איחור לעמדה");
		EVENT_DESC_MAP.put("4","אירוע חריג");	
		EVENT_DESC_MAP.put("5","איחור לתדריך");		
		EVENT_DESC_MAP.put("6","איחור מהפסקה");
		EVENT_DESC_MAP.put("7","יציאה מוקדמת");
		EVENT_DESC_MAP.put("8","ביטול פעילות");
		
	}
	
	public final static int DAY_TYPE_DAYOFF = 1;
	public final static int DAY_TYPE_TIMEOFF = 2;
	public final static int DAY_TYPE_NOACTIVITY = 3;
	public final static int DAY_TYPE_ACTIVITY = 4;	
	public final static int DAY_TYPE_EXCEPTION = 5;
	public final static int DAY_TYPE_MEAL = 6;	
	public final static int DAY_TYPE_BREAK = 7;
		
	public final static int MIN_RANGE_BETWEEN_BREAKS =60;
	
	public final static long DAY_CANCEL_ID = 99999999;
	
	public final static int STATE_EXCEPTION = 3;
	public final static int STATE_BREAK = 4;
	public final static int STATE_FULL_DAY_EXCEPTION = 7;
	
	public final static String REASON_ID = "שורה";	
	public final static String BRANCH_ID = "אגף";	
	public final static String REASON_DESC = "סיבה";	
	public final static String REPORTED = "מוצדק";	
	public final static String REPORT_REQUESTED = "דרוש אישור";
	public final static String LATE_TABLE = "סיבות לאיחורים";	
	public final static String MISSING_TABLE = "סיבות לחיסורים";			
	public final static String CHANGE_SHIFT = "סיבות להזיז משמרת";
	public final static String EVENT_TYPE_TABLE = "אירועים חריגים";
	public final static String EARLY_EXIT_TABLE = "סיבות ליציאה מוקדמת";
	public final static String CANCEL_SHIFT_TABLE = "סיבות לביטול פעילות";
	public final static String SUSPEND_MANAGEDBREAKS_TABLE = "סיבות להשהיית ניהול הפסקות אוטומטי";
	public final static String BUILDINGS_TABLE = "טבלת אתרים";
	
	public final static String STATUS_OPEN = "OPEN";
	public final static String STATUS_WAIT = "WAIT-FOR-ANSWER";
	public final static String STATUS_APPROVED = "APPROVED";

//Break	
	public final static int ASK_FOR_REPLACE = 1;
	public final static int REJECT_OFFER = 2;
	public final static int ACCEPT_OFFER = 3;
	public final static int CANCEL_CANDIDATE = 4;
	public final static int CANCEL_OFFER = 5;
	
//11.03.2010 - yuval	
	public final static String BREAK_FUTURE = "future";
	public final static String BREAK_CURRENT = "current";
	public final static String BREAK_NO_EXIT = "no_exit";
	public final static String BREAK_NO_ENTRY = "no_entry";
	public final static String BREAK_ENDED_OK = "ended_ok";
	public final static String BREAK_ENDED_NOT_OK = "ended_not_ok";
	
//Reduce
	public final static int APPROVE_REDUCE = 6;
	public final static int DECLINE_REDUCE = 7;

	public final static String VALID_SOURCE_FOR_REPLACE = "( 'WFM' )"; 
	
	public final static HashMap EVENT_REASON_MAP = new HashMap();

	static	{
		EVENT_REASON_MAP.put("1",MISSING_TABLE);
		EVENT_REASON_MAP.put("2",LATE_TABLE);
		EVENT_REASON_MAP.put("3",CHANGE_SHIFT);	
		EVENT_REASON_MAP.put("4",EVENT_TYPE_TABLE);		
		EVENT_REASON_MAP.put("7",EARLY_EXIT_TABLE);		
		EVENT_REASON_MAP.put("8",CANCEL_SHIFT_TABLE);	
	}
	
	
	public final static HashMap<String, String> BREAKS_TABS=new HashMap<String, String>();
	static{
		BREAKS_TABS.put("no_entry", "לא חזרו");
		BREAKS_TABS.put("current", "בהפסקה");
		BREAKS_TABS.put("ended_not_ok", "סיימו חריג");
		BREAKS_TABS.put("ended_ok", "סיימו");
		BREAKS_TABS.put("future", "עתידים לצאת");
		BREAKS_TABS.put("no_exit", "לא יצאו");
	}
	
	public final static String EXTRA_SHIFT_SOURCE="fExtra";
	
	public final static String LOGIN_SYSTEM_CTI="CTI";
	public final static String LOGIN_SYSTEM_COMPLETION="COMPLETION";
	
	public final static int COMPLETION_STATUS_OPEN=0;
	public final static int COMPLETION_STATUS_CALCULATED=1;
	public final static int COMPLETION_STATUS_CLOSED=10;
	public final static int COMPLETION_STATUS_CANCELED=50;
	public final static int COMPLETION_STATUS_NOT_SENT=99;
	
	public final static HashMap<Integer, String> COMPLETION_STATUS_MAP = new HashMap<Integer, String>();
	static	{
		COMPLETION_STATUS_MAP.put(COMPLETION_STATUS_OPEN,"פתוח");
		COMPLETION_STATUS_MAP.put(COMPLETION_STATUS_CALCULATED,"פתוח");
		COMPLETION_STATUS_MAP.put(COMPLETION_STATUS_CLOSED,"סגור");
		COMPLETION_STATUS_MAP.put(COMPLETION_STATUS_CANCELED,"מבוטל");	
		COMPLETION_STATUS_MAP.put(COMPLETION_STATUS_NOT_SENT,"לא מועבר");	
	}
		
	public final static int EMPLOYEE_STATUS_ACTIVE=3;
	public final static int EMPLOYEE_STATUS_TEMP=1;
	public final static int EMPLOYEE_STATUS_INACTIVE=2;
	
	//FORECAST - Yuval
	public final static int FORECAST_TIME_INTERVAL=15;
	public final static double FORECAST_CALC = 0.066666666667;
	public final static int CANCEL_OF_SWITCH = 561;
	public final static int SHIFT_REDUCE_BY_STAGE = 81; // צמצום משמרת עי אחמש מסך נוכחות

	public static final int EMPLOYEE_CATEGORY_JOB = 1;
	//Login cancel - yuval
	public static final String LOGIN_CANCEL_APPLIER_JOBS = "40668, 302275, 301343, 302301, 302525, 302526, 301351, 302200, 302527, 301109, 301279, 301017, 302700, 301007";
	public static final String LOGIN_CANCEL_UPDATER_JOBS = "40668, 302275, 301343, 302301, 302525, 302526, 301351, 302200, 302527, 301109, 301279, 301017, 302700, 301007";
	
	// SMS send - Igal
	public static final String SMS_SWITCH_MSG_PARAM = "שלום, התקבלה בקשה לאישורך להחלפת משמרת בתאריך {@}. בברכה, בזק.";
	public static final String SMS_FORCED_SWITCH_MSG_PARAM = "{@1} שלום, לבקשתך בוצעה החלפת משמרת עם {@2}, תאריך משמרת {@3}. בברכה, בזק.";
	
	// mobile_audit - Igal
	public static final String ACTION_LOGIN			=	"APP LOGIN";
	public static final String ACTION_OFFER_REPLACE	=	"OFFER REPLACE";
	public static final String ACTION_OFFER_ACCEPT	=	"OFFER ACCEPT";
	
	// Managed breaks - Igal
	public final static int SHF_SP_MIN_TIME_BEFORE_BREAK_UPDATE = 7;		// עבור מגבלת זמן של סופטפון לסריקת בסיס נתונים לזיהוי שינוי הפסקה, בדקות
	public final static int SHF_SP_RESPONSE_CHECK_INTERVAL = 3*1000;	// interval for checking DB for response from SoftPhone, in milliseconds
	public final static int SHF_SP_RESPONSE_CHECK_ATTEMPTS = 4;
	public final static int SHF_SP_PROCESS_ID_BREAK_UPDATE = 1;		// update break at edit shift screen (used for transaction table)
	public final static int SHF_SP_PROCESS_ID_SHIFT_UPDATE = 2;		// update shift at edit shift screen (used for transaction table)
	public final static int SHF_SP_PROCESS_ID_ADD_SHIFT = 3;		// Add inforce shift (single) (used for transaction table)
	public final static int SHF_SP_PROCESS_ID_DEL_SHIFT = 4;		// Delete shift (single) (used for transaction table)
	public final static int SHF_SP_PROCESS_ID_SWITCH_SHIFT = 5;		// Switch shifts (used for transaction table)
	public final static int SHF_SP_PROCESS_ID_SWITCH_BREAK = 6;		// Switch breaks (used for transaction table)
	public final static int BREAK_SMS_PROCESS_ID_SMS = 6;			// send SMS reminder at break end (used for transaction table)
	public final static String SHF_SP_ACTION_ID_FLAG_OFF = "1";		// Originally was "0", but it was inverted @ CTI and they ask to invert on SHF side too
	public final static String SHF_SP_ACTION_ID_FLAG_ON = "0";		// Originally was "1", but it was inverted @ CTI and they ask to invert on SHF side too
	public final static String SHF_SP_ACTION_ID_BREAK_UPDATE = "2";
	public final static String SHF_SP_SOURCE = "SHF";
	public final static String SHF_SP_DESTINATION = "IVR";

	public final static String SHF_SP_ATTRIBUTE_VALUE = "/app-config/jms/shf-sp/request/tibco-info/@queueJndiName";
	public final static String SHF_SP_JAXB_REQUEST_CONTEXT = "bzq.shfsp.request";
	public final static String SHF_SP_JAXB_RESPONSE_CONTEXT = "bzq.shfsp.response";
	public final static int SHF_SP_RESPONSE_SUCCESS_CODE = 0;
	
	// JMS
	public final static String SHF_JMS_QCF_JNDI_NAME = "jms/qcf/shfqcf";
	
	// BREAK SMS
	public final static String BREAK_SMS_USERID = "999999999";
	public final static String BREAK_SMS_MSG = "שלום, ההפסקה עומדת להסתיים, יש להגיע לעמדה בזמן";
	public final static String BREAK_SMS_SOURCE = "SHF";
	public final static String BREAK_SMS_DESTINATION = "VAST";
	
	// SHIFTER PELE IWD
	public final static int IWD_STATUS_NONE = 0;
	public final static int IWD_STATUS_PENDING = 1;
	public final static int IWD_STATUS_SENT = 2;
	public final static int IWD_STATUS_CANCELED = 3;
	public final static int IWD_STATUS_BREAK_PENDING = 4;
	public final static String SHF_IWD_JAXB_REQUEST_CONTEXT = "bzq.shfiwd";
	public final static String SHF_IWD_ATTRIBUTE_VALUE = "/app-config/jms/shf-iwd/tibco-info/@queueJndiName";
	public final static int TIMING_IWD_LIMIT = 12;
	
	// Add shifts from file
	public final static int ADD_SHIFTS_FILE_MAX_SIZE = 1024 * 1024 * 1; // kilobyte(1024) * megabyte(1024) * amount (size in megabytes), should be low, 1MB is default
	public final static int ADD_SHIFTS_FILE_MIN_COL = 5; // minimum columns amount
	
	// Shift location
	public final static String SHIFT_LOCATION_HOME = "home";
	public final static String SHIFT_LOCATION_SITE = "site";	
	
	
}
