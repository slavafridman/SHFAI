 /*
 * Created on 19/01/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.model;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.Charset;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Scanner;
import java.util.StringTokenizer;
import java.util.Vector;

import javax.jms.JMSException;
import javax.naming.NamingException;
import javax.servlet.ServletContext;
import javax.xml.bind.JAXBException;
import javax.xml.xpath.XPathExpressionException;

import org.apache.commons.validator.GenericValidator;
import org.apache.http.client.utils.URIBuilder;
import org.apache.log4j.Logger;
import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;
import org.apache.struts.upload.DiskFile;
import org.apache.struts.upload.FormFile;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;

import bzq.db.DBAccess;
import bzq.db.DBDuplicateKeyException;
import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.db.DBUpdateNoRowsException;
import bzq.shf.bean.AgentDayBean;
import bzq.shf.bean.BreakBean;
import bzq.shf.bean.ChangeRequestCandidate;
import bzq.shf.bean.EmployeeBean;
import bzq.shf.bean.EmployeeSkillBean;
import bzq.shf.bean.InnerJobBean;
import bzq.shf.bean.OrgUnitBean;
import bzq.shf.bean.PoolExtAllocBean;
import bzq.shf.bean.PotentialEmployeeBean;
import bzq.shf.bean.ShiftTreeNodeBean;
import bzq.shf.bean.TransactionBean;
import bzq.shf.dao.ReplaceMassageDao;
import bzq.shf.forms.AddShiftForm;
import bzq.shf.forms.AddShiftRequestForm;
import bzq.shf.forms.AttendanceSearchForm;
import bzq.shf.forms.EmployeeDataForm;
import bzq.shf.forms.EmployeeExceptionForm;
import bzq.shf.forms.EmployeeInforceListForm;
import bzq.shf.forms.PotentialInforceForm;
import bzq.shf.forms.ShiftBreakForm;
import bzq.shf.forms.ShiftChangeRequestForm;
import bzq.shf.forms.ShiftDataForm;
import bzq.shf.forms.ShiftInforceRequestForm;
import bzq.shf.forms.ShiftLoginCancelForm;
import bzq.shf.transfer.ReplaceByCritrion;
import bzq.shf.transfer.ReplaceMassage;
import bzq.shf.utils.CheckValidDate;
import bzq.shf.utils.DBResource;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.SHFParameters;
import bzq.shf.utils.SHFSmsSender;
import bzq.shf.utils.SHFTableUtils;
import bzq.shf.utils.SHFUtils;
import bzq.shf.utils.ShfException;
import bzq.shf.utils.ShfSwitchBreakExistsException;
import bzq.utils.AppInfo;
import bzq.utils.BaseConvert;
import bzq.utils.ConvertException;

import bzq.shfsp.request.SHFSPBreaks;
import bzq.shfsp.request.SHFSPBreaks.BreakInfo;

/**
 * @author 02964437
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ShiftDataModel {
	
	private static Logger logger = Logger.getLogger(ShiftDataModel.class);
	
	private ShiftDataForm shiftForm;
	private ShiftInforceRequestForm shiftInforce;
	private AddShiftRequestForm addShiftRequestForm;
	private ShiftChangeRequestForm shiftChangeRequestForm;
	private AddShiftForm addShiftForm;
	private PotentialInforceForm potentialInforceForm;
	private ShiftLoginCancelForm shiftLoginCancelForm;
	private ServletContext sCtx;
	
	/**
	 * @param shiftsForm
	 */
	public ShiftDataModel(ShiftDataForm form) {
		this.shiftForm = form;
	}
	public ShiftDataModel(ShiftInforceRequestForm form) {
		this.shiftInforce = form;
		
	}
	public ShiftDataModel(AddShiftRequestForm form) {
		this.addShiftRequestForm = form;
	}
	
	public ShiftDataModel(AddShiftForm form) {
		this.addShiftForm = form;
	}
	
	public ShiftDataModel(ShiftChangeRequestForm form){
		this.shiftChangeRequestForm=form;
	}
	public ShiftDataModel(PotentialInforceForm form) {
		this.potentialInforceForm = form;
	}
	public ShiftDataModel(ShiftLoginCancelForm form) {
		this.shiftLoginCancelForm = form;
	}
	/**
	 * 
	 */
	public ShiftDataModel() {
		super();
		
	}

	
	public static AgentDayBean populateShift(long dayId) throws ShfException{
		logger.debug("Starting populateShift() : dayId = " + dayId);
		int param_index = 1;
		StringBuffer sql = new StringBuffer();
		sql.append("select d.*, ");
		sql.append("c.NEW_ACTIVITY, ");
		sql.append("c.NEW_DAY_END, ");
		sql.append("c.NEW_DAY_START, ");
		sql.append("c.NEW_DAY_TYPE, ");
		sql.append("c.NEW_EMPLOYEE_ID, ");
		sql.append("c.NEW_EXCEPTION_TYPE_ID, ");
		sql.append("c.NEW_PAID_MINUTES, ");
		sql.append("c.NEW_SHIFT_END, ");
		sql.append("c.NEW_SHIFT_START, ");
		sql.append("c.NEW_SITE_ID, ");
		sql.append("c.NEW_TIMEOFF_TYPE_ID, ");
		sql.append("c.NEW_WORK_MINUTES, ");
		sql.append("c.START_CHANGE_REASON, ");
		sql.append("c.END_CHANGE_REASON, ");
		sql.append("c.SWITCH_DAY_ID, ");
		sql.append("c.MODIFICATION_TIME, ");
		sql.append("c.MODIFICATION_USER, ");
		sql.append("c.NEW_WORK_FROM_HOME, ");
		sql.append("c.NEW_SPLIT_SHIFT, ");
		sql.append("c.NEW_SPLIT_START, ");
		sql.append("c.NEW_SPLIT_END, ");
		sql.append("c.NEW_POOL_EXT_NUM,   "); 
		sql.append("c.NEW_POOL_ERR, ");
		
		sql.append("a.STAGE_ARRIVAL_TIME ,  ");
		sql.append("a.STATION_ARRIVAL_TIME ,  ");
		sql.append("a.STAGE_ARRIVAL_USER , ");
		sql.append("a.STATION_ARRIVAL_USER ,  ");
		sql.append("a.LATE_MINUTES , ");
		sql.append("a.LATE_REASON_ID , ");
		sql.append("a.MISS_REASON_ID , ");
		sql.append("a.MISSING_TIME , ");
		sql.append("a.MISSING_REMARK , ");
		sql.append("a.LATE_REMARK , ");
		sql.append("a.STATION_EXIT_TIME, ");
		sql.append("a.STATION_EXIT_USER, ");

		sql.append("e.EMPLOYEE_ID, ");
		sql.append("e.EMP_ID_NUMBER AS EMP_ID_NUMBER_FULL, ");
		sql.append("e.LAST_NAME, ");
		sql.append("e.FIRST_NAME, ");
		sql.append("e.JOB_ID, ");
		sql.append("e.INNER_JOB_ID, ");
		sql.append("e.ORG_UNIT_ID ");

		sql.append("from SHIFTER.shf_employee_day d ");
		sql.append("left join SHIFTER.shf_day_changes c on d.shf_employee_day_id=c.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = NVL(c.NEW_EMPLOYEE_ID,d.emp_id_number) ");
		sql.append("left join SHIFTER.shf_attendance a on d.shf_employee_day_id=a.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_org_unit u on u.org_unit_id = e.org_unit_id ");
		sql.append("where e.employee_id is not null  ");
		sql.append("and d.shf_employee_day_id = ?");
	
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setLong(param_index++, dayId);
			db.executeQuery();
			if(db.next()){ 
				AgentDayBean shift=new AgentDayBean();
				db.populate(shift); 
				return shift;
			}
			return null;
		} catch(DBQueryNoRowsException e){
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.populateFailed", null));
			throw new ShfException(actionErrors);
		} catch (DBException e) {
			logger.error("error in populateShift(): "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in populateShift() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
	}
	
	public void delFromChangesByDayId () throws ShfException {
		logger.debug("Starting delFromChangesByDayId()");
		
		StringBuffer sql = new StringBuffer();
		sql.append("DELETE FROM shifter.shf_day_changes c ");
		sql.append("WHERE c.shf_employee_day_id = ? ");
		
		int param = 1;
		DBAccess db = null;
		
		try {
			db = new DBAccess();
			db.prepareStatement(sql.toString());
			db.setLong(param++, shiftForm.getAgentDayId());
			db.executeUpdate();
		} catch(DBUpdateNoRowsException e) {
			
		} catch (DBException e) {
			logger.error("DB error while deleting : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally {
			try{
				db.close();
			}catch(DBException e){
				logger.error("Error while closing db connection : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
		
	}
	
	
	public void setFormDefaults() throws ShfException {
		logger.debug("Starting setFormDefaults()");
		Calendar cal=Calendar.getInstance();
		
		if(cal.get(Calendar.MINUTE)>10)
			cal.add(Calendar.HOUR_OF_DAY,1);
		int h=cal.get(Calendar.HOUR_OF_DAY);
		((ShiftDataForm)shiftForm).setTimeFrom(h+":00");
		((ShiftDataForm)shiftForm).setTimeTo(h+":00");
		((ShiftDataForm)shiftForm).setCurrentTime(h+":00");
		((ShiftDataForm)shiftForm).setAttendanceDate(cal.getTime());
		if(shiftForm.getAllowedMoked()!=null){
			((ShiftDataForm)shiftForm).setMoked(shiftForm.getAllowedMoked());
			String[] arr={"00"};
			((ShiftDataForm)shiftForm).setActivity(arr);
			
		}
	} 
	
	public void setCurrentDefaults() {
		logger.debug("Starting setCurrentDefaults()");
		Calendar cal=Calendar.getInstance();
		cal.getTime();
		String hour = String.valueOf(cal.get(Calendar.HOUR_OF_DAY));
		String minute = String.valueOf(cal.get(Calendar.MINUTE));
		if (minute.length()<2) { minute = "0" + minute; }
		((ShiftDataForm)shiftForm).setCurrentTime(hour + ":"+ minute);
		((ShiftDataForm)shiftForm).setAttendanceDate(cal.getTime());
	}	
	
	public void setChangeShiftDefaults() throws ShfException {
		logger.debug("Starting setChangeShiftDefaults()");
		if (((ShiftDataForm)shiftForm).getShiftStart() != null ) {
			((ShiftDataForm)shiftForm).setNewStartTime(BaseConvert.dateToString(((ShiftDataForm)shiftForm).getShiftStart(),"HH:mm"));				
			((ShiftDataForm)shiftForm).setNewStartDate(((ShiftDataForm)shiftForm).getShiftStart());				
		}	
		if (((ShiftDataForm)shiftForm).getShiftEnd() != null ) {
			((ShiftDataForm)shiftForm).setNewEndTime(BaseConvert.dateToString(((ShiftDataForm)shiftForm).getShiftEnd(),"HH:mm"));
			((ShiftDataForm)shiftForm).setNewEndDate(((ShiftDataForm)shiftForm).getShiftEnd());
		}
	}
	 
	
	public Vector populateShiftList() throws ShfException {
		logger.debug("Srtarting populateShiftList()");
		String dayDate=BaseConvert.dateToString(((ShiftDataForm)shiftForm).getAttendanceDate(),"dd/MM/yyyy");
		String timeFrom=dayDate+" "+((ShiftDataForm)shiftForm).getTimeFrom()+":00";
		String timeTo=dayDate+" "+((ShiftDataForm)shiftForm).getTimeTo()+":00";	
		Date fromDate=null,toDate=null;
		try{
			fromDate=BaseConvert.stringToDate(timeFrom,"dd/MM/yyyy HH:mm:ss");
			toDate=BaseConvert.stringToDate(timeTo,"dd/MM/yyyy HH:mm:ss");
		}catch(ConvertException e){
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}
				
		int param_index=1;
		
		StringBuffer sql=new StringBuffer();
		sql.append("(");
		sql.append("select ");
		sql.append("d.wm_shift_start_datetime AS shift_start,");
	   	sql.append("D.*, ");
	   	sql.append("NULL AS NEW_ACTIVITY, "); 
	   	sql.append("NULL AS NEW_DAY_END, "); 
	   	sql.append("NULL AS NEW_DAY_START, "); 
	   	sql.append("NULL AS NEW_DAY_TYPE, "); 
	   	sql.append("NULL AS NEW_EMPLOYEE_ID, "); 
	   	sql.append("NULL AS NEW_EXCEPTION_TYPE_ID, "); 
	   	sql.append("NULL AS NEW_PAID_MINUTES, "); 
	   	sql.append("NULL AS NEW_SHIFT_END, "); 
	   	sql.append("NULL AS NEW_SHIFT_START, "); 
	   	sql.append("NULL AS NEW_SITE_ID, ");
	   	sql.append("NULL AS NEW_TIMEOFF_TYPE_ID, "); 
	   	sql.append("NULL AS NEW_WORK_MINUTES , ");
	   	//sSql.append("NULL AS SHF_EMPLOYEE_DAY_ID, ");
	   	sql.append("NULL AS START_CHANGE_REASON, "); 
	   	sql.append("NULL AS END_CHANGE_REASON, "); 
	   	sql.append("NULL AS SWITCH_DAY_ID, ");
	   	sql.append("NULL AS MODIFICATION_TIME, "); 
	   	sql.append("NULL AS MODIFICATION_USER, "); 
	   	sql.append("NULL AS NEW_WORK_FROM_HOME, ");
	   	sql.append("NULL AS NEW_SPLIT_SHIFT, ");
	   	sql.append("NULL AS NEW_SPLIT_START, ");
	   	sql.append("NULL AS NEW_SPLIT_END, ");
		sql.append("NULL AS NEW_POOL_EXT_NUM, ");
		sql.append("NULL AS NEW_POOL_ERR, ");
		 
		sql.append("a.STAGE_ARRIVAL_TIME ,  ");
		sql.append("a.STATION_ARRIVAL_TIME ,  ");
		sql.append("a.STAGE_ARRIVAL_USER , ");
		sql.append("a.STATION_ARRIVAL_USER ,  ");
		sql.append("a.LATE_MINUTES , ");
		sql.append("a.LATE_REASON_ID , ");
		sql.append("a.MISS_REASON_ID , ");
		sql.append("a.MISSING_TIME , ");
		sql.append("a.MISSING_REMARK , ");
		sql.append("a.LATE_REMARK , ");
		sql.append("a.STATION_EXIT_TIME, ");
		sql.append("a.STATION_EXIT_USER, ");
		
		sql.append("e.EMPLOYEE_ID, ");
		sql.append("e.LAST_NAME, ");
		sql.append("e.FIRST_NAME, ");
		sql.append("e.JOB_ID, ");
		sql.append("e.ORG_UNIT_ID, ");
		sql.append("e.INNER_JOB_ID, ");
		
		sql.append("e_old.EMPLOYEE_ID AS EMPLOYEE_ID_OLD, ");
		sql.append("e_old.LAST_NAME AS LAST_NAME_OLD, ");
		sql.append("e_old.FIRST_NAME AS FIRST_NAME_OLD, ");
		
		sql.append(" l.applier_name, ");
		sql.append(" l.updater_name, ");
		sql.append(" l.cancel_login_remark ");
//		sql.append(" d.pool_ext_num, ");	
//		sql.append(" d.pool_err ");
		
		sql.append("FROM SHIFTER.shf_employee_day d ");
		sql.append("LEFT JOIN SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = d.emp_id_number ");
		sql.append("LEFT JOIN SHIFTER.shf_employees e_old on substr(e_old.emp_id_number,1,8) = d.emp_id_number ");
		sql.append("LEFT JOIN SHIFTER.shf_attendance a on d.shf_employee_day_id = a.shf_employee_day_id ");
		sql.append("LEFT JOIN SHIFTER.Shf_Cti_Cancel_Login_Shifts l on d.shf_employee_day_id = l.shf_employee_day_id ");
		sql.append("LEFT JOIN SHIFTER.shf_org_unit u on u.org_unit_id = e.org_unit_id ");
		sql.append("WHERE e.employee_id is not null AND d.WM_DAY_TYPE = ? ");	// 1
		if (shiftForm.isSwitchPotential()) {	// for switch potential, shifts in same week and not only same day
			sql.append("AND d.wm_shift_start_datetime between trunc(?+1,'IW')-1 and trunc(?+1,'IW')+6 ");	// 2,3
//			sql.append("AND d.wm_shift_start_datetime - sysdate >= ? ");	// not to bring past shifts (ie, not offer yesterday's shift) -> causing performance loss, moved to check in code instead here in SQL
		} else {
			sql.append("AND d.wm_shift_start_datetime >= ? AND d.wm_shift_start_datetime <= ? "); // 2,3	// original code, only shifts with same day
		}
		sql.append(" AND a.miss_reason_id is null ");
		sql.append("AND D.SHF_EMPLOYEE_DAY_ID  IN ");  
	    sql.append(" (SELECT D.SHF_EMPLOYEE_DAY_ID FROM SHIFTER.SHF_EMPLOYEE_DAY D  MINUS SELECT C.SHF_EMPLOYEE_DAY_ID "); 
	    sql.append(" FROM SHIFTER.SHF_DAY_CHANGES C) ");
		
		if(((ShiftDataForm)shiftForm).getMoked() != null && !((ShiftDataForm)shiftForm).getMoked().equals("-1")){
			if(((ShiftDataForm)shiftForm).getTeam() != null && !((ShiftDataForm)shiftForm).getTeam()[0].equals("00")){
				sql.append("AND e.org_unit_id in ( ");
				String[] array = ((ShiftDataForm)shiftForm).getTeam();
				for(int i=0;i<array.length;i++){
					sql.append(array[i]);
					if(i<array.length-1) sql.append(",");
				}
				sql.append(")");
			}else{
				sql.append("AND u.PARENT_UNIT = ? ");	// 4
			}
		} else {
			  StringBuffer unitSelect = new StringBuffer("");
			  unitSelect.append("AND u.PARENT_UNIT IN (" );
			  if ( shiftForm.getMyAgafMokedUnits() != null && shiftForm.getMyAgafMokedUnits().size() > 0 ) {	//	"if" condition added by Igal for switch potential 2015
				  Vector<bzq.shf.forms.OrgUnitTableForm> myAgafMokedUnits = shiftForm.getMyAgafMokedUnits();
				  Iterator  it = myAgafMokedUnits.iterator();
				  while (it.hasNext()) {
					unitSelect.append( ((bzq.shf.forms.OrgUnitTableForm)it.next()).getCode() ); 
					if (it.hasNext()) 
						unitSelect.append(","); 
				  }
				  
			  } else { 
				  // original code (Igal for switch potential 2015)
				  Vector allowedUnits = ((ShiftDataForm)shiftForm).getAllowedUnits();
				  Iterator  it = allowedUnits.iterator();
				  while (it.hasNext()) {
					unitSelect.append( it.next()); 
					if (it.hasNext()) 
						unitSelect.append(","); 
				  } 

			  }
			  unitSelect.append(" )");
			  sql.append(unitSelect);
		}
		
		// Svetlana
		/*if(((ShiftDataForm)shiftForm).getActivity()!=null && !"00".equals(((ShiftDataForm)shiftForm).getActivity()[0])){
			sql.append("AND replace(d.WM_SCH_ACTIVITY_ID_DATA,';','') in ( ");
			String[] array = ((ShiftDataForm)shiftForm).getActivity();
			for(int i=0;i<array.length;i++){
				sql.append(array[i]);
				if(i<array.length-1) sql.append(",");
			}
			sql.append(")");
		}*/
		
		if(!"00".equals(((ShiftDataForm)shiftForm).getJob()) && ((ShiftDataForm)shiftForm).getJob()!= null){
			sql.append("AND e.JOB_ID = ? ");	// 5
		}
		
		if( ((AttendanceSearchForm)shiftForm).getInnerJob()!=null && (!"00".equals(((AttendanceSearchForm)shiftForm).getInnerJob()[0]))){
			sql.append("AND e.INNER_JOB_ID in (");
			String[] array = ((AttendanceSearchForm)shiftForm).getInnerJob();
			for(int i=0;i<array.length;i++){
				sql.append(array[i]);
				if(i<array.length-1) sql.append(",");
			}
			sql.append(")");
		}
		
		if (shiftForm.getWorkLocation() != null && !"00".equals(shiftForm.getWorkLocation()[0])) {
			sql.append("AND d.WORK_FROM_HOME in (");
			List<String> list = Arrays.asList(shiftForm.getWorkLocation());
			
			if (list.contains(SHFConstants.SHIFT_LOCATION_HOME)) {
				sql.append("'Y'");
			}
			if (list.size() > 1) {
				sql.append(",");
			}			
			if (list.contains("site")) {
				sql.append("'N'");
			}
			sql.append(") ");			
		}
		
		sql.append(" ) UNION ALL (");
		
	   	sql.append("SELECT ");
	   	sql.append("C.NEW_SHIFT_START AS shift_start,");
	    sql.append("D.*, ");
	   	sql.append("C.NEW_ACTIVITY, "); 
	   	sql.append("C.NEW_DAY_END, "); 
	   	sql.append("C.NEW_DAY_START, "); 
	   	sql.append("C.NEW_DAY_TYPE, "); 
	   	sql.append("C.NEW_EMPLOYEE_ID, "); 
	   	sql.append("C.NEW_EXCEPTION_TYPE_ID, "); 
	   	sql.append("C.NEW_PAID_MINUTES, "); 
	   	sql.append("C.NEW_SHIFT_END, "); 
	   	sql.append("C.NEW_SHIFT_START, "); 
	   	sql.append("C.NEW_SITE_ID, ");
	   	sql.append("C.NEW_TIMEOFF_TYPE_ID, "); 
	   	sql.append("C.NEW_WORK_MINUTES , ");
	   	sql.append("C.START_CHANGE_REASON, ");
	   	sql.append("C.END_CHANGE_REASON, ");
	   	sql.append("C.SWITCH_DAY_ID, ");
	   	sql.append("C.MODIFICATION_TIME, ");
	   	sql.append("C.MODIFICATION_USER, ");
	   	sql.append("C.NEW_WORK_FROM_HOME, ");
	   	sql.append("C.NEW_SPLIT_SHIFT, ");
	   	sql.append("C.NEW_SPLIT_START, ");
	   	sql.append("C.NEW_SPLIT_END, ");
		sql.append("c.NEW_POOL_EXT_NUM, ");	
		sql.append("c.NEW_POOL_ERR, ");

		sql.append("a.STAGE_ARRIVAL_TIME ,  ");
		sql.append("a.STATION_ARRIVAL_TIME ,  ");
		sql.append("a.STAGE_ARRIVAL_USER , ");
		sql.append("a.STATION_ARRIVAL_USER ,  ");
		sql.append("a.LATE_MINUTES , ");
		sql.append("a.LATE_REASON_ID , ");
		sql.append("a.MISS_REASON_ID , ");
		sql.append("a.MISSING_TIME , ");
		sql.append("a.MISSING_REMARK , ");
		sql.append("a.LATE_REMARK , ");
		sql.append("a.STATION_EXIT_TIME, ");
		sql.append("a.STATION_EXIT_USER, ");
		
		sql.append("e.EMPLOYEE_ID, ");
		sql.append("e.LAST_NAME, ");
		sql.append("e.FIRST_NAME, ");
		sql.append("e.JOB_ID, ");
		sql.append("e.ORG_UNIT_ID, ");
		sql.append("e.INNER_JOB_ID, ");
		
		sql.append("e_old.EMPLOYEE_ID AS EMPLOYEE_ID_OLD, ");
		sql.append("e_old.LAST_NAME AS LAST_NAME_OLD, ");
		sql.append("e_old.FIRST_NAME AS FIRST_NAME_OLD, ");
		
		sql.append(" l.applier_name, ");
		sql.append(" l.updater_name, ");
		sql.append(" l.cancel_login_remark ");	

		
		sql.append("from SHIFTER.SHF_EMPLOYEE_DAY D, SHIFTER.SHF_DAY_CHANGES C ");
		sql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEES E ON SUBSTR(E.EMP_ID_NUMBER,1,8) = C.NEW_EMPLOYEE_ID ");
		sql.append("left join SHIFTER.shf_employees e_old on substr(e_old.emp_id_number,1,8) = C.NEW_EMPLOYEE_ID ");
		sql.append("left join SHIFTER.shf_attendance a on c.SHF_EMPLOYEE_DAY_ID=a.shf_employee_day_id ");
		sql.append("left join SHIFTER.Shf_Cti_Cancel_Login_Shifts l on c.shf_employee_day_id=l.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_org_unit u on u.org_unit_id = e.org_unit_id ");
		sql.append("where e.employee_id is not null AND c.CANCEL_REASON_CODE is null AND c.NEW_DAY_TYPE=? ");	// 6
		sql.append("AND D.SHF_EMPLOYEE_DAY_ID = C.SHF_EMPLOYEE_DAY_ID ");
		if (shiftForm.isSwitchPotential()) {
			sql.append("AND c.NEW_SHIFT_START between trunc(?+1,'IW')-1 and trunc(?+1,'IW')+6 ");	// 7,8
//			sql.append("AND c.NEW_SHIFT_START - sysdate >= ? ");	// not to bring past shifts (ie, not offer yesterday's shift) -> causing performance loss
		} else {
			sql.append("AND c.NEW_SHIFT_START >= ? AND c.NEW_SHIFT_START <= ? "); // 7,8	// original code, only shifts with same day
		}
		sql.append(" AND a.miss_reason_id is null ");
		
		
		if(((ShiftDataForm)shiftForm).getMoked() != null && !((ShiftDataForm)shiftForm).getMoked().equals("-1")){
			if(((ShiftDataForm)shiftForm).getTeam() != null && !((ShiftDataForm)shiftForm).getTeam()[0].equals("00")){
				sql.append("AND e.org_unit_id in ( ");
				String[] array = ((ShiftDataForm)shiftForm).getTeam();
				for(int i=0;i<array.length;i++){
					sql.append(array[i]);
					if(i<array.length-1) sql.append(",");
				}
				sql.append(")");
			}else{
				sql.append("AND u.PARENT_UNIT = ? ");	// 9
			}
		}
		else{
			  StringBuffer unitSelect = new StringBuffer("");
			  unitSelect.append("AND u.PARENT_UNIT IN (" );
			  if ( shiftForm.getMyAgafMokedUnits() != null && shiftForm.getMyAgafMokedUnits().size() > 0 ) {	//	"if" condition added by Igal for switch potential 2015
				  Vector<bzq.shf.forms.OrgUnitTableForm> myAgafMokedUnits = shiftForm.getMyAgafMokedUnits();
				  Iterator  it = myAgafMokedUnits.iterator();
				  while (it.hasNext()) {
					unitSelect.append( ((bzq.shf.forms.OrgUnitTableForm)it.next()).getCode() ); 
					if (it.hasNext()) 
						unitSelect.append(","); 
				  }
				  
			  } else { 
				  // original code (Igal for switch potential 2015)
				  Vector allowedUnits = ((ShiftDataForm)shiftForm).getAllowedUnits();
				  Iterator  it = allowedUnits.iterator();
				  while (it.hasNext()) {
					unitSelect.append( it.next()); 
					if (it.hasNext()) 
						unitSelect.append(","); 
				  } 

			  }
			  unitSelect.append(" )");
			  sql.append(unitSelect);
		}
		
		// Svetlana
		/*if(((ShiftDataForm)shiftForm).getActivity()!=null && !"00".equals(((ShiftDataForm)shiftForm).getActivity()[0])){
			sql.append("AND replace(C.NEW_ACTIVITY,';','') in ( ");
			String[] array = ((ShiftDataForm)shiftForm).getActivity();
			for(int i=0;i<array.length;i++){
				sql.append(array[i]);
				if(i<array.length-1) sql.append(",");
			}
			sql.append(")");
		}*/
		
		if(!"00".equals(((ShiftDataForm)shiftForm).getJob()) && ((ShiftDataForm)shiftForm).getJob()!= null){
			sql.append("AND e.JOB_ID = ? ");	// 10
		}
		
		if( ((AttendanceSearchForm)shiftForm).getInnerJob()!=null && (!"00".equals(((AttendanceSearchForm)shiftForm).getInnerJob()[0]))){
			sql.append("AND e.INNER_JOB_ID in (");
			String[] array = ((AttendanceSearchForm)shiftForm).getInnerJob();
			for(int i=0;i<array.length;i++){
				sql.append(array[i]);
				if(i<array.length-1) sql.append(",");
			}
			sql.append(")");
		}
		
		if (shiftForm.getWorkLocation() != null && !"00".equals(shiftForm.getWorkLocation()[0])) {
			sql.append("AND c.NEW_WORK_FROM_HOME in (");
			List<String> list = Arrays.asList(((AttendanceSearchForm)shiftForm).getWorkLocation());
			
			if (list.contains(SHFConstants.SHIFT_LOCATION_HOME)) {
				sql.append("'Y'");
			}
			if (list.size() > 1) {
				sql.append(",");
			}			
			if (list.contains("site")) {
				sql.append("'N'");
			}
			sql.append(") ");			
		}
		
		sql.append(")");
		
		sql.append(" ORDER BY SHIFT_START, FIRST_NAME, LAST_NAME");

		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sql.toString());
			//SQL - 1 - PAREAMETER
			dBAccess.setInt(param_index++,SHFConstants.DAY_TYPE_ACTIVITY);	// 1
			dBAccess.setTimestamp(param_index++,fromDate);	// 2
			dBAccess.setTimestamp(param_index++,toDate);	// 3
			
//			if (shiftForm.isSwitchPotential()) {
//				String minHoursBeforeSwitch = SHFParameters.getMinHoursBeforeSwitch(SHFTableUtils.getAgafCodeOf(shiftForm.getMoked())).getValue();
//				double minHoursBeforeSwitchNum = (SHFUtils.parseLong(minHoursBeforeSwitch,SimpleFactoryDao.DEFUALT_TIME_BEFORE_SHIFT_BEGIN)/SimpleFactoryDao.TIME_BEFORE_SHIFT_BEGIN);
//				dBAccess.setDouble(param_index++,minHoursBeforeSwitchNum);
//			}
			
			if(((ShiftDataForm)shiftForm).getMoked()!=null && !((ShiftDataForm)shiftForm).getMoked().equals("-1")){
				if(((ShiftDataForm)shiftForm).getTeam()!=null && !((ShiftDataForm)shiftForm).getTeam()[0].equals("00")){
					
				}else{
					dBAccess.setString(param_index++,((ShiftDataForm)shiftForm).getMoked());	// 4
				}
				
			}
			
			/*if(((ShiftDataForm)shiftForm).getActivity()!=null && !"00".equals(((ShiftDataForm)shiftForm).getActivity()[0])){
				dBAccess.setString(param_index,((ShiftDataForm)shiftForm).getActivity()[0]);	
				param_index++;
			}*/
			
			if(!"00".equals(((ShiftDataForm)shiftForm).getJob()) && ((ShiftDataForm)shiftForm).getJob()!= null){
				dBAccess.setString(param_index,((ShiftDataForm)shiftForm).getJob());	// 5
				param_index++;
			}
			
			//SQL - 2 - PAREAMETER
			dBAccess.setInt(param_index++,SHFConstants.DAY_TYPE_ACTIVITY);	// 6
			dBAccess.setTimestamp(param_index++,fromDate);	// 7
			dBAccess.setTimestamp(param_index++,toDate);	// 8
			
//			if (shiftForm.isSwitchPotential()) {
//				String minHoursBeforeSwitch = SHFParameters.getMinHoursBeforeSwitch(SHFTableUtils.getAgafCodeOf(shiftForm.getMoked())).getValue();
//				double minHoursBeforeSwitchNum = (SHFUtils.parseLong(minHoursBeforeSwitch,SimpleFactoryDao.DEFUALT_TIME_BEFORE_SHIFT_BEGIN)/SimpleFactoryDao.TIME_BEFORE_SHIFT_BEGIN);
//				dBAccess.setDouble(param_index++,minHoursBeforeSwitchNum);
//			}
			
			if(((ShiftDataForm)shiftForm).getMoked() != null && !((ShiftDataForm)shiftForm).getMoked().equals("-1")){
				if(((ShiftDataForm)shiftForm).getTeam() != null && !((ShiftDataForm)shiftForm).getTeam()[0].equals("00")){
					
				}else{
					dBAccess.setString(param_index++,((ShiftDataForm)shiftForm).getMoked());	// 9
				}
				
			}
			
			/*if(((ShiftDataForm)shiftForm).getActivity()!=null && !"00".equals(((ShiftDataForm)shiftForm).getActivity()[0])){
				dBAccess.setString(param_index,((ShiftDataForm)shiftForm).getActivity()[0]);	
				param_index++;
			}*/
			
			if(!"00".equals(((ShiftDataForm)shiftForm).getJob()) && ((ShiftDataForm)shiftForm).getJob()!= null){
				dBAccess.setString(param_index,((ShiftDataForm)shiftForm).getJob());	// 10
				param_index++;
			}
			
			dBAccess.executeQuery();
			Vector attlist = new Vector();
			dBAccess.populate("bzq.shf.bean.AgentDayBean",attlist);
			
			return attlist;
		} catch(DBQueryNoRowsException e){
	
		} catch (DBException e) {
			logger.error("error in populateShiftList(): "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.populateFailed", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				sql=null;
				dBAccess.close();
			} catch (DBException e) {
				logger.error("error in populateShiftList() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		return null;
	}

	//ORIGINAL FUNCTION - 31.01.2011 - Yuval
//	public Vector populateShiftList() throws ShfException {
//		logger.debug("Srtarting populateShiftList()");
//		String dayDate=BaseConvert.dateToString(((ShiftDataForm)shiftForm).getAttendanceDate(),"dd/MM/yyyy");
//		String timeFrom=dayDate+" "+((ShiftDataForm)shiftForm).getTimeFrom()+":00";
//		String timeTo=dayDate+" "+((ShiftDataForm)shiftForm).getTimeTo()+":00";	
//		Date fromDate=null,toDate=null;
//		try{
//			fromDate=BaseConvert.stringToDate(timeFrom,"dd/MM/yyyy HH:mm:ss");
//			toDate=BaseConvert.stringToDate(timeTo,"dd/MM/yyyy HH:mm:ss");
//		}catch(ConvertException e){
//			ActionErrors actionErrors = new ActionErrors();
//			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general"));
//			throw new ShfException(actionErrors);
//		}
//				
//		int param_index=1;
//		
//		StringBuffer sql=new StringBuffer();
//		sql.append("select d.*, ");
//		sql.append("c.NEW_ACTIVITY, ");
//		sql.append("c.NEW_DAY_END, ");
//		sql.append("c.NEW_DAY_START, ");
//		sql.append("c.NEW_DAY_TYPE, ");
//		sql.append("c.NEW_EMPLOYEE_ID, ");
//		sql.append("c.NEW_EXCEPTION_TYPE_ID, ");
//		sql.append("c.NEW_PAID_MINUTES, ");
//		sql.append("c.NEW_SHIFT_END, ");
//		sql.append("c.NEW_SHIFT_START, ");
//		sql.append("c.NEW_SITE_ID, ");
//		sql.append("c.NEW_TIMEOFF_TYPE_ID, ");
//		sql.append("c.NEW_WORK_MINUTES, ");
//		sql.append("c.START_CHANGE_REASON, ");
//		sql.append("c.END_CHANGE_REASON, ");
//		sql.append("c.SWITCH_DAY_ID, ");
//		sql.append("c.MODIFICATION_TIME, ");
//		sql.append("c.MODIFICATION_USER, ");
//		
//		sql.append("a.STAGE_ARRIVAL_TIME ,  ");
//		sql.append("a.STATION_ARRIVAL_TIME ,  ");
//		sql.append("a.STAGE_ARRIVAL_USER , ");
//		sql.append("a.STATION_ARRIVAL_USER ,  ");
//		sql.append("a.LATE_MINUTES , ");
//		sql.append("a.LATE_REASON_ID , ");
//		sql.append("a.MISS_REASON_ID , ");
//		sql.append("a.MISSING_TIME , ");
//		sql.append("a.MISSING_REMARK , ");
//		sql.append("a.LATE_REMARK , ");
//		sql.append("a.STATION_EXIT_TIME, ");
//		sql.append("a.STATION_EXIT_USER, ");
//		
//		sql.append("e.EMPLOYEE_ID, ");
//		sql.append("e.LAST_NAME, ");
//		sql.append("e.FIRST_NAME, ");
//		sql.append("e.JOB_ID, ");
//		sql.append("e.ORG_UNIT_ID, ");
//		sql.append("e.INNER_JOB_ID, ");
//		
//		sql.append("e_old.EMPLOYEE_ID AS EMPLOYEE_ID_OLD, ");
//		sql.append("e_old.LAST_NAME AS LAST_NAME_OLD, ");
//		sql.append("e_old.FIRST_NAME AS FIRST_NAME_OLD ");
//		
//		
//		sql.append("from SHIFTER.shf_employee_day d ");
//		sql.append("left join SHIFTER.shf_day_changes c on d.shf_employee_day_id=c.shf_employee_day_id ");
//		sql.append("left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = NVL(c.NEW_EMPLOYEE_ID,d.emp_id_number) ");
//		sql.append("left join SHIFTER.shf_employees e_old on substr(e_old.emp_id_number,1,8) = d.emp_id_number ");
//		sql.append("left join SHIFTER.shf_attendance a on d.shf_employee_day_id=a.shf_employee_day_id ");
//		sql.append("left join SHIFTER.shf_org_unit u on u.org_unit_id = e.org_unit_id ");
//		sql.append("where e.employee_id is not null AND c.CANCEL_REASON_CODE is null AND NVL(c.NEW_DAY_TYPE,d.WM_DAY_TYPE)=? ");
//		sql.append("and nvl(c.NEW_SHIFT_START,d.wm_shift_start_datetime) >= ? AND nvl(c.NEW_SHIFT_START,d.wm_shift_start_datetime) <= ? ");
//		sql.append(" and a.miss_reason_id is null ");
//		
//		if(((ShiftDataForm)shiftForm).getMoked()!=null && !((ShiftDataForm)shiftForm).getMoked().equals("-1")){
//			if(((ShiftDataForm)shiftForm).getTeam()!=null && !((ShiftDataForm)shiftForm).getTeam()[0].equals("00")){
//				sql.append("AND e.org_unit_id in ( ");
//				String[] array = ((ShiftDataForm)shiftForm).getTeam();
//				for(int i=0;i<array.length;i++){
//					sql.append(array[i]);
//					if(i<array.length-1) sql.append(",");
//				}
//				sql.append(")");
//			}else{
//				sql.append("AND u.PARENT_UNIT = ? ");
//			}
//		}
//		else{
//			  StringBuffer unitSelect = new StringBuffer("");
//			  unitSelect.append("AND u.PARENT_UNIT IN (" );
//			  Vector allowedUnits = ((ShiftDataForm)shiftForm).getAllowedUnits();
//			  Iterator  it = allowedUnits.iterator();
//			  while (it.hasNext()) {
//				unitSelect.append( it.next()); 
//				if (it.hasNext()) 
//					unitSelect.append(","); 
//			  } 
//			  unitSelect.append(" )");
//			  sql.append(unitSelect);
//		}
//		
//		if(((ShiftDataForm)shiftForm).getActivity()!=null && !"00".equals(((ShiftDataForm)shiftForm).getActivity()[0])){
//			sql.append("AND replace(d.WM_SCH_ACTIVITY_ID_DATA,';','') in ( ");
//			String[] array = ((ShiftDataForm)shiftForm).getActivity();
//			for(int i=0;i<array.length;i++){
//				sql.append(array[i]);
//				if(i<array.length-1) sql.append(",");
//			}
//			sql.append(")");
//		}
//		
//		if(!"00".equals(((ShiftDataForm)shiftForm).getJob()) && ((ShiftDataForm)shiftForm).getJob()!= null){
//			sql.append("AND e.JOB_ID = ? ");
//		}
//		
//		if( ((AttendanceSearchForm)shiftForm).getInnerJob()!=null && (!"00".equals(((AttendanceSearchForm)shiftForm).getInnerJob()[0]))){
//			sql.append("AND e.INNER_JOB_ID in (");
//			String[] array = ((AttendanceSearchForm)shiftForm).getInnerJob();
//			for(int i=0;i<array.length;i++){
//				sql.append(array[i]);
//				if(i<array.length-1) sql.append(",");
//			}
//			sql.append(")");
//		}
//		
//		sql.append(" ORDER BY d.wm_shift_start_datetime,e.FIRST_NAME,e.LAST_NAME");
//
//		DBAccess dBAccess=null;
//		try {
//			dBAccess=new DBAccess();
//			dBAccess.prepareStatement(sql.toString());
//			dBAccess.setInt(param_index++,SHFConstants.DAY_TYPE_ACTIVITY);
//			dBAccess.setTimestamp(param_index++,fromDate);
//			dBAccess.setTimestamp(param_index++,toDate);
//			
//			if(((ShiftDataForm)shiftForm).getMoked()!=null && !((ShiftDataForm)shiftForm).getMoked().equals("-1")){
//				if(((ShiftDataForm)shiftForm).getTeam()!=null && !((ShiftDataForm)shiftForm).getTeam()[0].equals("00")){
//					
//				}else{
//					dBAccess.setString(param_index++,((ShiftDataForm)shiftForm).getMoked());
//				}
//				
//			}
//			
//			/*if(((ShiftDataForm)shiftForm).getActivity()!=null && !"00".equals(((ShiftDataForm)shiftForm).getActivity()[0])){
//				dBAccess.setString(param_index,((ShiftDataForm)shiftForm).getActivity()[0]);	
//				param_index++;
//			}*/
//			
//			if(!"00".equals(((ShiftDataForm)shiftForm).getJob()) && ((ShiftDataForm)shiftForm).getJob()!= null){
//				dBAccess.setString(param_index,((ShiftDataForm)shiftForm).getJob());	
//				param_index++;
//			}
//			
//			dBAccess.executeQuery();
//			Vector attlist=new Vector();
//			dBAccess.populate("bzq.shf.bean.AgentDayBean",attlist);
//			
//			return attlist;
//		} catch(DBQueryNoRowsException e){
//	
//		} catch (DBException e) {
//			logger.error("error in populateShiftList(): "+e.getMessage());
//			ActionErrors actionErrors = new ActionErrors();
//			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.populateFailed", null));
//			throw new ShfException(actionErrors);
//		} finally{
//			try {
//				sql=null;
//				dBAccess.close();
//			} catch (DBException e) {
//				logger.error("error in populateShiftList() while closing db connection: "+e.getMessage());
//				ActionErrors actionErrors = new ActionErrors();
//				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general"));
//				throw new ShfException(actionErrors);
//			}
//		}
//		return null;
//	}
	
	public Vector populateCurrentShift() throws ShfException{
		logger.debug("Starting populateCurrentShift()");
		Vector vec=new Vector();
		vec=getCurrentShifts();
		if(vec!=null && vec.size()>0)
			populateCurrentShiftSum(vec);
		return vec;
	}
	
	public Vector getCurrentShifts() throws ShfException{
		logger.debug("Starting getCurrentShifts()");
		int param_index=1;
		StringBuffer sql=new StringBuffer();

		sql.append("select d.*, ");
		sql.append("c.NEW_ACTIVITY, ");
		sql.append("c.NEW_DAY_END, ");
		sql.append("c.NEW_DAY_START, ");
		sql.append("c.NEW_DAY_TYPE, ");
		sql.append("c.NEW_EMPLOYEE_ID, ");
		sql.append("c.NEW_EXCEPTION_TYPE_ID, ");
		sql.append("c.NEW_PAID_MINUTES, ");
		sql.append("c.NEW_SHIFT_END, ");
		sql.append("c.NEW_SHIFT_START, ");
		sql.append("c.NEW_SITE_ID, ");
		sql.append("c.NEW_TIMEOFF_TYPE_ID, ");
		sql.append("c.NEW_WORK_MINUTES, ");
		sql.append("c.START_CHANGE_REASON, ");
		sql.append("c.END_CHANGE_REASON, ");
		sql.append("c.SWITCH_DAY_ID, ");
		sql.append("c.MODIFICATION_TIME, ");
		sql.append("c.MODIFICATION_USER, ");
		sql.append("c.NEW_WORK_FROM_HOME, ");
		sql.append("a.STAGE_ARRIVAL_TIME ,  ");
		sql.append("a.STATION_ARRIVAL_TIME ,  ");
		sql.append("a.STAGE_ARRIVAL_USER , ");
		sql.append("a.STATION_ARRIVAL_USER ,  ");
		sql.append("a.LATE_MINUTES , ");
		sql.append("a.LATE_REASON_ID , ");
		sql.append("a.MISS_REASON_ID , ");
		sql.append("a.MISSING_TIME , ");
		sql.append("a.MISSING_REMARK , ");
		sql.append("a.LATE_REMARK , ");
		sql.append("a.STATION_EXIT_TIME, ");
		sql.append("a.STATION_EXIT_USER, ");

		sql.append("e.EMPLOYEE_ID, ");
		sql.append("e.LAST_NAME, ");
		sql.append("e.FIRST_NAME, ");
		sql.append("e.JOB_ID, ");
		sql.append("e.ORG_UNIT_ID, ");
		sql.append("e.INNER_JOB_ID, ");

		sql.append("e_old.EMPLOYEE_ID AS EMPLOYEE_ID_OLD, ");
		sql.append("e_old.LAST_NAME AS LAST_NAME_OLD, ");
		sql.append("e_old.FIRST_NAME AS FIRST_NAME_OLD ");

		sql.append("from SHIFTER.shf_employee_day d ");
		sql.append("left join SHIFTER.shf_day_changes c on d.shf_employee_day_id=c.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = NVL(c.NEW_EMPLOYEE_ID,d.emp_id_number) ");
		sql.append("left join SHIFTER.shf_employees e_old on substr(e_old.emp_id_number,1,8) = d.emp_id_number ");		
		sql.append("left join SHIFTER.shf_attendance a on d.shf_employee_day_id=a.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_org_unit u on u.org_unit_id = e.org_unit_id ");
		sql.append("where e.employee_id is not null AND c.CANCEL_REASON_CODE is null AND NVL(c.NEW_DAY_TYPE,d.WM_DAY_TYPE)=? ");
		sql.append("and  ? >= nvl(c.NEW_SHIFT_START,d.wm_shift_start_datetime) AND ? < nvl(c.NEW_SHIFT_END,d.wm_shift_end_datetime) ");
  
		if(((ShiftDataForm)shiftForm).getMoked()!=null && !((ShiftDataForm)shiftForm).getMoked().equals("-1")){
			if(((ShiftDataForm)shiftForm).getTeam()!=null && !((ShiftDataForm)shiftForm).getTeam()[0].equals("00")){
				
				sql.append("AND e.org_unit_id in ( ");
				String[] array = ((ShiftDataForm)shiftForm).getTeam();
				for(int i=0;i<array.length;i++){
					sql.append(array[i]);
					if(i<array.length-1) sql.append(",");
				}
				sql.append(")");
				
			}else{
				sql.append("AND u.PARENT_UNIT = ? ");
			}
		}else{
			StringBuffer unitSelect = new StringBuffer("");
			unitSelect.append("AND u.PARENT_UNIT IN (" );
			Vector allowedUnits = ((ShiftDataForm)shiftForm).getAllowedUnits();
			Iterator  it = allowedUnits.iterator();
			while (it.hasNext()) {
				unitSelect.append( it.next()); 
				if (it.hasNext()) 
				unitSelect.append(","); 
			} 
			unitSelect.append(" )");
			sql.append(unitSelect);
		}
		sql.append(" ORDER BY d.wm_shift_start_datetime,e.FIRST_NAME,e.LAST_NAME");
		Date currentTimeDate=null;
  
		try{
			String dstr=BaseConvert.dateToString(((ShiftDataForm)shiftForm).getAttendanceDate(), "dd/MM/yyyy");
			currentTimeDate=BaseConvert.stringToDate(dstr+" "+((ShiftDataForm)shiftForm).getCurrentTime()+":00","dd/MM/yyyy HH:mm:ss");
		}catch(ConvertException e){
			throw new ShfException("error on populateCurrentShift() , error converting string to date.", e);
		}	  

		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setInt(param_index++,SHFConstants.DAY_TYPE_ACTIVITY);
			db.setTimestamp(param_index++,currentTimeDate);	
			db.setTimestamp(param_index++,currentTimeDate);		
			 
			if(((ShiftDataForm)shiftForm).getMoked()!=null && !((ShiftDataForm)shiftForm).getMoked().equals("-1")){
				if(((ShiftDataForm)shiftForm).getTeam()!=null && !((ShiftDataForm)shiftForm).getTeam()[0].equals("00")){
					//db.setString(param_index++,((ShiftDataForm)shiftForm).getTeam());	
				}else{
					db.setString(param_index++,((ShiftDataForm)shiftForm).getMoked());
				}
				
			}
	
			db.executeQuery();
			Vector vec=new Vector();
			db.populate("bzq.shf.bean.AgentDayBean",vec);
			return vec;
		}catch(DBQueryNoRowsException e){
		
		} catch (DBException e) {
			logger.error("error in populateCurrentShift() : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				sql=null;
				db.close();
			} catch (DBException e) {
				logger.error("error in populateCurrentShift() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
		return null;
	}


 	private void populateCurrentShiftSum(Vector v) throws ShfException {		  
		logger.debug("Starting populateCurrentShiftSum() Vector size = " + v.size());
		ShiftTreeNodeBean mainNode=new ShiftTreeNodeBean();
		HashMap tree=mainNode.getSons();
		AgentDayBean dayInfo=null;
			
		for(int a=0;a<v.size();a++){
			dayInfo=(AgentDayBean)v.get(a);
			String activity=dayInfo.getShiftActivity();
			if(activity!=null){
				if (activity.indexOf(";") > 0){
					activity = activity.substring(0,activity.indexOf(";"));	
				}
			}
					  	  
			String moked=SHFTableUtils.getMokedCodeOf(dayInfo.getOrgUnitCode());
			mainNode.increaseTotal();
			if(dayInfo.getStationArrivalTime()!=null)
				mainNode.increaseExistSum();
			if(dayInfo.getMissingReasonId()>0)
				mainNode.increaseMissSum();
				
			if(tree.containsKey(moked)){
			ShiftTreeNodeBean node=(ShiftTreeNodeBean)tree.get(moked);
			node.increaseTotal();
			if(dayInfo.getStationArrivalTime()!=null){
				node.increaseExistSum();
			}
			if(dayInfo.getMissingReasonId()>0){
			node.increaseMissSum();
			}
			}else{
				ShiftTreeNodeBean node=new ShiftTreeNodeBean();
				node.increaseTotal();
				if(dayInfo.getStationArrivalTime()!=null){
					node.increaseExistSum();
				}
				if(dayInfo.getMissingReasonId()>0){
					node.increaseMissSum();
				}
				tree.put(moked,node);
			}
			ShiftTreeNodeBean node=(ShiftTreeNodeBean)tree.get(moked);
			HashMap activities=node.getSons();
			if(activities.containsKey(activity)){
				ShiftTreeNodeBean actnode=(ShiftTreeNodeBean)activities.get(activity);
				actnode.increaseTotal();
				if(dayInfo.getStationArrivalTime()!=null){
					actnode.increaseExistSum();
				}
				if(dayInfo.getMissingReasonId()>0){
					actnode.increaseMissSum();
				}
			}else{
				ShiftTreeNodeBean actnode=new ShiftTreeNodeBean();
				actnode.increaseTotal();
				if(dayInfo.getStationArrivalTime()!=null){
					actnode.increaseExistSum();
				}
				if(dayInfo.getMissingReasonId()>0){
					actnode.increaseMissSum();
				}
				activities.put(activity,actnode);
			}
			EmployeeDataForm employeeForm=new EmployeeDataForm();
			employeeForm.setEmployeeId(dayInfo.getEmployeeId());
			EmployeeDataModel employee=new EmployeeDataModel(employeeForm);
			Vector skills=employee.populateSkills(1);
				
			ShiftTreeNodeBean actnode=(ShiftTreeNodeBean)activities.get(activity);
			HashMap lang=actnode.getSons();
			if(skills!=null)
				for(int i=0;i<skills.size();i++){
					if(lang.containsKey(((EmployeeSkillBean)skills.get(i)).getSkillId())){
						ShiftTreeNodeBean skillnode=(ShiftTreeNodeBean)lang.get(String.valueOf(((EmployeeSkillBean)skills.get(i)).getSkillId()));
					skillnode.increaseTotal();
					if(dayInfo.getStationArrivalTime()!=null)
						skillnode.increaseExistSum();
					if(dayInfo.getMissingReasonId()>0)
						skillnode.increaseMissSum();
				}else{
					  ShiftTreeNodeBean skillnode=new ShiftTreeNodeBean();
					  skillnode.increaseTotal();
					  if(dayInfo.getStationArrivalTime()!=null)
					  	skillnode.increaseExistSum();
					  if(dayInfo.getMissingReasonId()>0)
					  	skillnode.increaseMissSum();
					  lang.put(String.valueOf(((EmployeeSkillBean)skills.get(i)).getSkillId()),skillnode);
				}
			}
	 	}
		shiftForm.setTree(mainNode);
		//shiftForm.setAttendanceList((AgentDayBean[])list.toArray(new AgentDayBean[list.size()]));		
	}
		

	public Vector populateMyShifts() throws ShfException, ConvertException {
		logger.debug("AttendanceModel: beginning of populate.");

		int param_index=1;
		
		StringBuffer sql=new StringBuffer();
		/*
		sql.append("select d.*, ");
		sql.append("c.NEW_ACTIVITY, ");
		sql.append("c.NEW_DAY_END, ");
		sql.append("c.NEW_DAY_START, ");
		sql.append("c.NEW_DAY_TYPE, ");
		sql.append("c.NEW_EMPLOYEE_ID, ");
		sql.append("c.NEW_EXCEPTION_TYPE_ID, ");
		sql.append("c.NEW_PAID_MINUTES, ");
		sql.append("c.NEW_SHIFT_END, ");
		sql.append("c.NEW_SHIFT_START, ");
		sql.append("c.NEW_SITE_ID, ");
		sql.append("c.NEW_TIMEOFF_TYPE_ID, ");
		sql.append("c.NEW_WORK_MINUTES, ");
		sql.append("c.START_CHANGE_REASON, ");
		sql.append("c.END_CHANGE_REASON, ");
		sql.append("c.SWITCH_DAY_ID, ");
		sql.append("c.MODIFICATION_TIME, ");
		sql.append("c.MODIFICATION_USER, ");
		
		sql.append("a.STAGE_ARRIVAL_TIME ,  ");
		sql.append("a.STATION_ARRIVAL_TIME ,  ");
		sql.append("a.STAGE_ARRIVAL_USER , ");
		sql.append("a.STATION_ARRIVAL_USER ,  ");
		sql.append("a.LATE_MINUTES , ");
		sql.append("a.LATE_REASON_ID , ");
		sql.append("a.MISS_REASON_ID , ");
		sql.append("a.MISSING_TIME , ");
		sql.append("a.MISSING_REMARK , ");
		sql.append("a.LATE_REMARK , ");
		sql.append("a.STATION_EXIT_TIME, ");
		sql.append("a.STATION_EXIT_USER, ");
		
		sql.append("e.EMPLOYEE_ID, ");
		sql.append("e.LAST_NAME, ");
		sql.append("e.FIRST_NAME, ");
		sql.append("e.JOB_ID, ");
		sql.append("e.REPLACE_ALLOWED, ");
		sql.append("e.ORG_UNIT_ID, ");

		sql.append("e_old.EMPLOYEE_ID AS EMPLOYEE_ID_OLD, ");
		sql.append("e_old.LAST_NAME AS LAST_NAME_OLD, ");
		sql.append("e_old.FIRST_NAME AS FIRST_NAME_OLD ");

		
		sql.append("from SHIFTER.shf_employee_day d ");
		sql.append("left join SHIFTER.shf_day_changes c on d.shf_employee_day_id=c.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = NVL(c.NEW_EMPLOYEE_ID,d.emp_id_number) ");
		sql.append("left join SHIFTER.shf_employees e_old on substr(e_old.emp_id_number,1,8) = d.emp_id_number ");		
		sql.append("left join SHIFTER.shf_attendance a on d.shf_employee_day_id=a.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_org_unit u on u.org_unit_id = e.org_unit_id ");
		sql.append("where e.employee_id is not null AND c.CANCEL_REASON_CODE is null AND NVL(c.NEW_DAY_TYPE,d.WM_DAY_TYPE)=? ");
		sql.append("and e.EMP_ID_NUMBER = ? ");
		
		sql.append("and nvl(c.NEW_SHIFT_START,d.wm_shift_start_datetime) > ? ");
		
		sql.append(" ORDER BY nvl(c.NEW_SHIFT_START,d.wm_shift_start_datetime) desc");
	*/
		
		sql.append("(select d.wm_sch_activity_id_data, ");
		sql.append("d.WM_END_DATETIME, ");
		sql.append("d.WM_START_DATETIME, ");
		sql.append("d.wm_day_type, ");
		sql.append("d.emp_id_number, ");
		sql.append("d.wm_exception_type_id, ");
		sql.append("d.wm_work_minutes, ");
		sql.append("d.wm_shift_end_datetime, ");
		sql.append("d.wm_shift_start_datetime, ");
		sql.append("d.wm_site_id, ");
		sql.append("d.wm_timeoff_type_id, ");
		sql.append("d.wm_work_minutes, ");
		sql.append("d.SHF_EMPLOYEE_DAY_ID, ");
		sql.append("null, ");
		sql.append("null, ");
		sql.append("null, ");
		sql.append("null, ");
		sql.append("null, ");
		
		sql.append("a.STAGE_ARRIVAL_TIME ,  ");
		sql.append("a.STATION_ARRIVAL_TIME ,  ");
		sql.append("a.STAGE_ARRIVAL_USER , ");
		sql.append("a.STATION_ARRIVAL_USER ,  ");
		sql.append("a.LATE_MINUTES , ");
		sql.append("a.LATE_REASON_ID , ");
		sql.append("a.MISS_REASON_ID , ");
		sql.append("a.MISSING_TIME , ");
		sql.append("a.MISSING_REMARK , ");
		sql.append("a.LATE_REMARK , ");
		sql.append("a.STATION_EXIT_TIME, ");
		sql.append("a.STATION_EXIT_USER ,");
		
		
		sql.append("e.EMPLOYEE_ID, ");
		sql.append("e.LAST_NAME, ");
		sql.append("e.FIRST_NAME, ");
		sql.append("e.JOB_ID, ");
		sql.append("e.REPLACE_ALLOWED, ");
		sql.append("e.ORG_UNIT_ID ");

		/*sql.append("e_old.EMPLOYEE_ID AS EMPLOYEE_ID_OLD, ");
		sql.append("e_old.LAST_NAME AS LAST_NAME_OLD, ");
		sql.append("e_old.FIRST_NAME AS FIRST_NAME_OLD ");
		*/
	
		sql.append("from SHIFTER.shf_employees e ,SHIFTER.shf_org_unit u,SHIFTER.shf_employee_day d "); 
		sql.append("left join SHIFTER.shf_attendance a on d.shf_employee_day_id=a.shf_employee_day_id "); 
		sql.append("WHERE e.employee_id is not null ");  
		sql.append("AND d.WM_DAY_TYPE= ? "); 
		sql.append("and e.EMP_ID_NUMBER = ? ");
		sql.append("and	 substr(e.emp_id_number,1,8) = d.emp_id_number ");
		sql.append("and	u.org_unit_id = e.org_unit_id ");
		sql.append("and d.wm_shift_start_datetime > ? "); 
		sql.append("and d.shf_employee_day_id in  ");
		sql.append("(select d.shf_employee_day_id from SHIFTER.shf_employee_day d  minus select c.shf_employee_day_id " );
		sql.append("from shifter.shf_day_changes c) )");
		
		
		
		sql.append("union  all");
		
		sql.append("( select c.NEW_ACTIVITY, ");
		sql.append("c.NEW_DAY_END, ");
		sql.append("c.NEW_DAY_START, ");
		sql.append("c.NEW_DAY_TYPE, ");
		sql.append("c.NEW_EMPLOYEE_ID, ");
		sql.append("c.NEW_EXCEPTION_TYPE_ID, ");
		sql.append("c.NEW_PAID_MINUTES, ");
		sql.append("c.NEW_SHIFT_END, ");
		sql.append("c.NEW_SHIFT_START, ");
		sql.append("c.NEW_SITE_ID, ");
		sql.append("c.NEW_TIMEOFF_TYPE_ID, ");
		sql.append("c.NEW_WORK_MINUTES ,");
		sql.append("c.SHF_EMPLOYEE_DAY_ID, ");
		sql.append("c.START_CHANGE_REASON, ");
		sql.append("c.END_CHANGE_REASON, ");
		sql.append("c.SWITCH_DAY_ID, ");
		sql.append("c.MODIFICATION_TIME, ");
		sql.append("c.MODIFICATION_USER, ");
	
		
		sql.append("a.STAGE_ARRIVAL_TIME ,  ");
		sql.append("a.STATION_ARRIVAL_TIME ,  ");
		sql.append("a.STAGE_ARRIVAL_USER , ");
		sql.append("a.STATION_ARRIVAL_USER ,  ");
		sql.append("a.LATE_MINUTES , ");
		sql.append("a.LATE_REASON_ID , ");
		sql.append("a.MISS_REASON_ID , ");
		sql.append("a.MISSING_TIME , ");
		sql.append("a.MISSING_REMARK , ");
		sql.append("a.LATE_REMARK , ");
		sql.append("a.STATION_EXIT_TIME, ");
		sql.append("a.STATION_EXIT_USER ,");
		
		sql.append("e.EMPLOYEE_ID, ");
		sql.append("e.LAST_NAME, ");
		sql.append("e.FIRST_NAME, ");
		sql.append("e.JOB_ID, ");
		sql.append("e.REPLACE_ALLOWED, ");
		sql.append("e.ORG_UNIT_ID ");

		/*sql.append("e_old.EMPLOYEE_ID AS EMPLOYEE_ID_OLD, ");
		sql.append("e_old.LAST_NAME AS LAST_NAME_OLD, ");
		sql.append("e_old.FIRST_NAME AS FIRST_NAME_OLD ");
		*/
			
		sql.append("from SHIFTER.shf_employees e ,SHIFTER.shf_org_unit u ,shifter.shf_day_changes c ");
		sql.append("left join SHIFTER.shf_attendance a on c.new_employee_id=a.shf_employee_day_id  ");
		sql.append("WHERE e.employee_id is not null ");  
		sql.append("AND c.NEW_DAY_TYPE = ? "); 
		sql.append("and e.EMP_ID_NUMBER = ? ");
		sql.append("and substr(e.emp_id_number,1,8) = c.new_employee_id ");
		sql.append("and u.org_unit_id = e.org_unit_id ");
		sql.append(" and  c.NEW_SHIFT_START > ? ) "); 
		sql.append("ORDER BY 3 desc ");
		 
	
		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sql.toString());
			dBAccess.setInt(param_index++,SHFConstants.DAY_TYPE_ACTIVITY);
		    dBAccess.setString(param_index++,((ShiftDataForm)shiftForm).getUserId());	
			
			dBAccess.setDate(param_index++,shiftForm.getNewShiftStart());	
			
			dBAccess.setInt(param_index++,SHFConstants.DAY_TYPE_ACTIVITY);
		    dBAccess.setString(param_index++,((ShiftDataForm)shiftForm).getUserId());	
			
			dBAccess.setDate(param_index++,shiftForm.getNewShiftStart());	
			
			
			dBAccess.executeQuery();
			Vector attlist=new Vector();
			dBAccess.populate("bzq.shf.bean.AgentDayBean",attlist);
		
			return attlist;
		} catch(DBQueryNoRowsException e){
	
		} catch (DBException e) {
			logger.error("error in populateMyShifts() : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				sql=null;
				dBAccess.close();
			} catch (DBException e) {
				logger.error("error in populateMyShifts() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);				
			}
		}
		return null;
	}

	/**
	 * ////// shift inforce ////////
	 */
	
	public Vector doAction() throws ShfException{
		logger.debug("Starting doAction()");
		Vector v=null;
		if(shiftInforce.getMode()==null){
			shiftInforce.setMode("update");
		}
		if(shiftInforce.getMode().equals("populate")){
			v=populateShiftAddRequests();
			populateAddedDays(v);
		}
		else if(shiftInforce.getMode().equals("add")){ 
			try{	
				validateInforceRequest();
			}catch(ShfException e){
				throw e;
			}
			addShiftAddRequest();
			v=populateShiftAddRequests();
			populateAddedDays(v);
		}
		else if(shiftInforce.getMode().equals("update")){
			//try{	
			//	validateInforceRequest();
			//}catch(ShfException e){
			//	throw e;
			//}
			if(shiftInforce.getShiftStart()==null){
				updateShiftAddRequestNum();
			}else{
				updateShiftAddRequest();
			}	
			v=populateShiftAddRequests();
			populateAddedDays(v);
		}
		else if(shiftInforce.getMode().equals("delete")){
			populateInforce();
			
			//deleteShiftAddRequest();
			//tamar  הוספת מחיקה גם של טבלאות 

			DBAccess db=null;
			db=new DBAccess();
			deleteShiftAddRequest(db); 
			deleteShiftAddRequestTeam(db);
			deleteShiftAddRequestInnerJob(db);
			
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in closeDeleteShiftAddRequest() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		
			//tamar הוספת מחיקה  מחיקה גגם של טבלאות הקשר   
			v=populateShiftAddRequests();
			populateAddedDays(v);
		}
		else if(shiftInforce.getMode().equals("update_view")){
			populateInforce();
			if(shiftInforce.getBreaksNumber()>0){
				shiftInforce.setFirstBreakTime(shiftInforce.getFirstBreakTime().substring(11,16));
			}
			if(shiftInforce.getBreaksNumber()>1){
				shiftInforce.setSecondBreakTime(shiftInforce.getSecondBreakTime().substring(11,16));
			}
			if(shiftInforce.getBreaksNumber()>2){
				shiftInforce.setThirdBreakTime(shiftInforce.getThirdBreakTime().substring(11,16));
			}
			
		}
		return v;
	}
	
	/**
	 * 
	 */
	private void validateInforceRequest()throws ShfException {
		logger.debug("Starting validateInforceRequest()");
		Date date=shiftInforce.getDate();
		String datestr=BaseConvert.dateToString(date,"dd/MM/yyyy");
		String startstr=BaseConvert.dateToString(shiftInforce.getShiftStart(),"HH:mm");
		String endstr=BaseConvert.dateToString(shiftInforce.getShiftEnd(),"HH:mm");
		Date shiftStart=null,shiftEnd=null;
		try {
			shiftStart=BaseConvert.stringToDate(datestr + " " + startstr,"dd/MM/yyyy HH:mm");
			shiftEnd=BaseConvert.stringToDate(datestr + " " + endstr,"dd/MM/yyyy HH:mm");
		} catch (ConvertException e) {
			throw new ShfException("");
		}
		
		if(shiftEnd.before(shiftStart)){
			long tt=shiftEnd.getTime();
			tt+=(24*60*60*1000);
			shiftEnd.setTime(tt);
		}
		shiftInforce.setShiftStart(shiftStart);
		shiftInforce.setShiftEnd(shiftEnd);
		
		int duration=SHFUtils.getMinutesBetween(shiftStart,shiftEnd);
		String len=SHFParameters.getMinimalShiftDuration(shiftInforce.getAllowedMoked()).getValue();
		int minlen=0;
		if(len!=null){
			minlen=Integer.parseInt(len);
		}
		String len2=SHFParameters.getMaximalShiftDuration(shiftInforce.getAllowedMoked()).getValue();
		int maxlen=0;
		if(len2!=null){
			maxlen=Integer.parseInt(len2);
		}
		
		Calendar cal=Calendar.getInstance();
		cal.set(Calendar.HOUR_OF_DAY, 0);
		cal.set(Calendar.MINUTE,0);
		cal.set(Calendar.SECOND, 0);
		
		if(duration<minlen){
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.lowShiftDuration",null));
			throw new ShfException(actionErrors);
		}
		if(shiftStart.before(cal.getTime())){
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.pastDate",null));
			throw new ShfException(actionErrors);
		}
		if(duration>maxlen){
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.highShiftDuration",null));
			throw new ShfException(actionErrors);
		}
		if(shiftInforce.getOriginalNumOfAgents()<shiftInforce.getAddedShiftsNum()){
			ActionError error=new ActionError("shf.error.inforceLowAgentsNum",String.valueOf(shiftInforce.getAddedShiftsNum()));
			throw new ShfException(error);
		}
	}
	
	
	private void populateInforce() throws ShfException{
		logger.debug("Startung populateInforce()");
		StringBuffer sql=new StringBuffer();
		sql.append("SELECT ");
		sql.append("t.SHIFT_INFORCE_ID, ");
		sql.append("t.SHIFT_DATE, ");
		sql.append("t.SHIFT_START, ");
		sql.append("t.SHIFT_END, ");
		sql.append("t.REMARK, ");
		sql.append("t.TRADITIONAL, ");
		sql.append("t.WORK_FROM_HOME, ");
		sql.append("t.JOB_CATAGORY_TYPE, ");
		sql.append("t.AGENTS_NUMBER, ");
		sql.append("t.ORIGINAL_AGENTS_NUMBER, ");
		sql.append("t.SKILL_ID, ");
		sql.append("t.MOKED_ID, ");
		sql.append("t.ACTIVITY_TYPE_ID, ");
		sql.append("BREAKS_NUMBER, ");
		sql.append("FIRST_BREAK_TIME, ");
		sql.append("FIRST_BREAK_LENGTH, ");
		sql.append("SECOND_BREAK_TIME, ");
		sql.append("SECOND_BREAK_LENGTH, ");
		sql.append("THIRD_BREAK_TIME, ");
		sql.append("THIRD_BREAK_LENGTH, ");
		sql.append("t.CREATION_TIME, ");
		sql.append("t.MODIFICATION_USER, ");
		sql.append("t.MODIFICATION_TIME, ");
		sql.append("(");
		sql.append("select count(*) from shifter.shf_employee_day d ");
		sql.append("left join shifter.shf_day_changes c on c.shf_employee_day_id=d.shf_employee_day_id ");
		sql.append("left join shifter.shf_employees e on substr(e.emp_id_number,1,8)=nvl(c.new_employee_id,d.emp_id_number) ");
		sql.append("where e.employee_id>0 AND d.source='f'||t.shift_inforce_id ");
		sql.append(") as ADDED_SHIFTS_NUM ");
		sql.append("FROM SHIFTER.SHF_SHIFT_INFORCE_REQ t where t.SHIFT_INFORCE_ID = ? ");
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setInt(1,shiftInforce.getId());
			db.executeQuery();
			if(db.next()){
				db.populate(shiftInforce);
			}
			
		} catch(DBQueryNoRowsException e){
			logger.error("error in populateInforce() inforce not found : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.inforceNotExists", null));
			throw new ShfException(actionErrors);
		} catch (DBException e) {
			logger.error("error in populateInforce() : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.populateFailed", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				sql=null;
				db.close();
			} catch (DBException e) {
				logger.error("error in populateInforce() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.populateFailed", null));
				throw new ShfException(actionErrors);
			}
		}
	}
	
	private void populateAddedDays(Vector v) throws ShfException{
		logger.debug("Starting populateAddedDays()");
		if(v!=null && v.size()>0){
			for(int i=0;i<v.size();i++){
				// לבדוק עם תמר
				populateAddRequestDays((ShiftInforceRequestForm)v.get(i));
		//tamar-שליפה של כל הצוותים וכל התפקידים	
				
			
				ShiftInforceRequestForm shift = new ShiftInforceRequestForm();
				shift=(ShiftInforceRequestForm)v.get(i);
				populateAddRequestTeam(shift);
				//if(shift.getOrgUnitBean()==null){
				//	populateTeam(shift);
				//}
				String[] orgTeam = new String[shift.getOrgUnitBean().length];
				String[] orgTeamNumber = new String[shift.getOrgUnitBean().length];
				if(shift.getOrgUnitBean()!=null){
					for(int k=0;k<shift.getOrgUnitBean().length;k++){
						OrgUnitBean org = new OrgUnitBean();
						org= shift.getOrgUnitBean()[k];
						orgTeam[k]=org.getOrgUnitName();
						if(orgTeam[k]==null){
							orgTeam[k]="הכל";
						}
						orgTeamNumber[k]=org.getOrgUnit();
						}
					shift.setTeam(orgTeam);
					shift.setTeamNumber(orgTeamNumber);
					}
				populateAddRequestJob((ShiftInforceRequestForm)v.get(i));
				//if(shift.getInnerJobBean()==null){
				//	populateJob(shift);
				//}
				String[] orgJob = new String[shift.getInnerJobBean().length];
				int[] orgJobNumber = new int[shift.getInnerJobBean().length];
				if(shift.getInnerJobBean()!=null){
					for(int k=0;k<shift.getInnerJobBean().length;k++){
						InnerJobBean job = new InnerJobBean();
						job= shift.getInnerJobBean()[k];
						orgJob[k]=job.getInnerJobName();
						if(orgJob[k]==null){
							orgJob[k]="הכל";
						}
						orgJobNumber[k]=job.getInnerJobId();
						}
					shift.setInnerJob(orgJob);
					shift.setInnerJobNumber(orgJobNumber);
				}
				
				//tamar-שליפה של כל הצוותים וכל התפקידים
			}
		}
	}
	
	private static void populateAddRequestDays(ShiftInforceRequestForm req) throws ShfException{
		logger.debug("Starting populateAddRequestDays() dayId = " + req.getId());
		StringBuffer sql=new StringBuffer();
		sql.append("SELECT d.*, ");
		sql.append("a.STAGE_ARRIVAL_TIME , ");
		sql.append("a.STATION_ARRIVAL_TIME , ");
		sql.append("a.STAGE_ARRIVAL_USER , ");
		sql.append("a.STATION_ARRIVAL_USER , ");
		sql.append("a.LATE_MINUTES , ");
		sql.append("a.LATE_REASON_ID , ");
		sql.append("a.MISS_REASON_ID , ");
		sql.append("a.MISSING_TIME , ");
		sql.append("a.MISSING_REMARK , ");
		sql.append("a.LATE_REMARK , ");
		sql.append("a.STATION_EXIT_TIME, ");
		sql.append("a.STATION_EXIT_USER, ");
		sql.append("e.EMPLOYEE_ID, ");
		sql.append("e.LAST_NAME, ");
		sql.append("e.FIRST_NAME, ");
		sql.append("e.JOB_ID, ");
		sql.append("e.ORG_UNIT_ID ");
		sql.append("from SHIFTER.shf_employee_day d ");
		sql.append("left join SHIFTER.shf_day_changes c on d.shf_employee_day_id=c.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = NVL(c.NEW_EMPLOYEE_ID,d.emp_id_number) ");
		sql.append("left join SHIFTER.shf_attendance a on d.shf_employee_day_id=a.shf_employee_day_id ");
		sql.append("where e.EMPLOYEE_ID>0 AND d.source = ? ");
		DBAccess db=null;
		try{
		db=new DBAccess();
		db.prepareStatement(sql.toString());
		db.setString(1,"f"+req.getId());
		db.executeQuery();
		Vector vec=new Vector();
		db.populate("bzq.shf.bean.AgentDayBean",vec);
		req.setDays((AgentDayBean[])vec.toArray(new AgentDayBean[vec.size()]));
		req.setAddedShiftsNum(vec.size());
		}catch(DBQueryNoRowsException e){
		}catch(DBException e){
		logger.error("error in populateAddRequestDays() : "+e.getMessage());
		ActionErrors actionErrors = new ActionErrors();
		actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
		throw new ShfException(actionErrors); 
		}finally{
		try {
		sql=null;
		db.close();
		} catch (DBException e) {
		logger.error("error in populateAddRequestDays() while closing db connection : "+e.getMessage());
		ActionErrors actionErrors = new ActionErrors();
		actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
		throw new ShfException(actionErrors);
		}
		}
		}

private static void populateTeam(ShiftInforceRequestForm req) throws ShfException{
		
		logger.debug("Starting populateTeam() dayId = " + req.getMoked());
		StringBuffer sql=new StringBuffer();
		sql.append("select * from shf_org_unit t ");
		sql.append("where  t.parent_unit = ? ");
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setString(1,req.getMoked());
			db.executeQuery();
			Vector<OrgUnitBean> orgUnitVec=new Vector<OrgUnitBean>();
			OrgUnitBean orgUnitInfo=null;
			while(db.next()){
				orgUnitInfo=new OrgUnitBean();
                db.populate(orgUnitInfo);
                orgUnitVec.add(orgUnitInfo);
			}
			if (!orgUnitVec.isEmpty()){
				req.setOrgUnitBean((OrgUnitBean[])orgUnitVec.toArray(new OrgUnitBean[orgUnitVec.size()]));
			}


		}catch(DBQueryNoRowsException e){
			
		}catch(DBException e){
			logger.error("error in populateTeam() : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);				
		}finally{
			try {
				sql=null;
				db.close();
			} catch (DBException e) {
				logger.error("error in populateTeam() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
	}
private static void populateJob(ShiftInforceRequestForm req) throws ShfException{
	
	logger.debug("Starting populateJob() dayId = " + req.getMoked());
	StringBuffer sql=new StringBuffer();
	sql.append("select * ");
	sql.append("from shifter.shf_inner_jobs t ");
	DBAccess db=null;
	try{
		db=new DBAccess();
		db.prepareStatement(sql.toString());
		db.executeQuery();
		Vector<InnerJobBean> innerJobVec=new Vector<InnerJobBean>();
		InnerJobBean innerJobInfo=null;
		while(db.next()){
			innerJobInfo=new InnerJobBean();
            db.populate(innerJobInfo);
            innerJobVec.add(innerJobInfo);
		}
		if (!innerJobVec.isEmpty()){
			req.setInnerJobBean((InnerJobBean[])innerJobVec.toArray(new InnerJobBean[innerJobVec.size()]));
		}


	}catch(DBQueryNoRowsException e){
		
	}catch(DBException e){
		logger.error("error in populateJob() : "+e.getMessage());
		ActionErrors actionErrors = new ActionErrors();
		actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
		throw new ShfException(actionErrors);				
	}finally{
		try {
			sql=null;
			db.close();
		} catch (DBException e) {
			logger.error("error in populateJob() while closing db connection : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}
	}
}
	
// הורדתי פונקציה כפולה - לבדוק עם תמר מה הנכונה
// בדקנו ונראה שצריך למחוק את זאת
//	public Vector populateShiftAddRequests() throws ShfException{
//		logger.debug("Starting populateShiftAddRequests()");
//		StringBuffer sql=new StringBuffer();
//		sql.append("SELECT d.*, ");
//		sql.append("a.STAGE_ARRIVAL_TIME ,  ");
//		sql.append("a.STATION_ARRIVAL_TIME ,  ");
//		sql.append("a.STAGE_ARRIVAL_USER , ");
//		sql.append("a.STATION_ARRIVAL_USER ,  ");
//		sql.append("a.LATE_MINUTES , ");
//		sql.append("a.LATE_REASON_ID , ");
//		sql.append("a.MISS_REASON_ID , ");
//		sql.append("a.MISSING_TIME , ");
//		sql.append("a.MISSING_REMARK , ");
//		sql.append("a.LATE_REMARK , ");
//		sql.append("a.STATION_EXIT_TIME, ");
//		sql.append("a.STATION_EXIT_USER, ");
//		sql.append("e.EMPLOYEE_ID, ");
//		sql.append("e.LAST_NAME, ");
//		sql.append("e.FIRST_NAME, ");
//		sql.append("e.JOB_ID, ");
//		sql.append("e.ORG_UNIT_ID ");
//
//		sql.append("from SHIFTER.shf_employee_day d ");
//		sql.append("left join SHIFTER.shf_day_changes c on d.shf_employee_day_id=c.shf_employee_day_id ");
//		sql.append("left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = NVL(c.NEW_EMPLOYEE_ID,d.emp_id_number) ");
//		sql.append("left join SHIFTER.shf_attendance a on d.shf_employee_day_id=a.shf_employee_day_id ");
//		sql.append("where e.EMPLOYEE_ID>0 AND d.source = ? ");
//		DBAccess db=null;
//		try{
//			db=new DBAccess();
//			db.prepareStatement(sql.toString());
//			db.setString(1,"f"+req.getId());
//			db.executeQuery();
//			Vector vec=new Vector();
//			db.populate("bzq.shf.bean.AgentDayBean",vec);
//			req.setDays((AgentDayBean[])vec.toArray(new AgentDayBean[vec.size()]));
//			req.setAddedShiftsNum(vec.size());
//		}catch(DBQueryNoRowsException e){
//			
//		}catch(DBException e){
//			logger.error("error in populateAddRequestDays() : "+e.getMessage());
//			ActionErrors actionErrors = new ActionErrors();
//			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
//			throw new ShfException(actionErrors);				
//		}finally{
//			try {
//				sql=null;
//				db.close();
//			} catch (DBException e) {
//				logger.error("error in populateAddRequestDays() while closing db connection : "+e.getMessage());
//				ActionErrors actionErrors = new ActionErrors();
//				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
//				throw new ShfException(actionErrors);
//			}
//		}
//	}
	//tamar   שליפת כל הצוותים שקשורים לתגבור המשמרת
private static void populateAddRequestTeam(ShiftInforceRequestForm req) throws ShfException{
		
		logger.debug("Starting populateAddRequestTeam() dayId = " + req.getId());
		StringBuffer sql=new StringBuffer();
		Vector<OrgUnitBean> orgUnitVec=new Vector<OrgUnitBean>();
		OrgUnitBean orgUnitInfo=null;
		
		
		sql.append("select a.ORG_UNIT_ID ,a.ORG_UNIT_NAME from shf_shift_inforce_team t ");
		sql.append("left join shifter.shf_org_unit a on a.org_unit_id=t.org_unit_id ");
		sql.append("where  t.shift_inforce_id = ? ");
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setInt(1,req.getId());
			db.executeQuery();
			
			while(db.next()){
				orgUnitInfo=new OrgUnitBean();
                db.populate(orgUnitInfo);
                orgUnitVec.add(orgUnitInfo);
			}
			

		}catch(DBQueryNoRowsException e){
			orgUnitInfo=new OrgUnitBean();
			orgUnitInfo.setOrgUnit("00");
	        orgUnitVec.add(orgUnitInfo);
	      
			
			
		}catch(DBException e){
			logger.error("error in populateAddRequestTeam() : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);				
		}finally{
			try {
				if (!orgUnitVec.isEmpty()){
					req.setOrgUnitBean((OrgUnitBean[])orgUnitVec.toArray(new OrgUnitBean[orgUnitVec.size()]));
				}
				sql=null;
				db.close();
			} catch (DBException e) {
				logger.error("error in populateAddRequestTeam() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
	}
//tamar שליפת כל הצוותים שקשורים למשמרת
private static void populateAddRequestJob(ShiftInforceRequestForm req) throws ShfException{
	
	logger.debug("Starting populateAddRequestJob() dayId = " + req.getId());
	Vector<InnerJobBean> innerJobVec=new Vector<InnerJobBean>();
	InnerJobBean innerJobInfo=null;
	StringBuffer sql=new StringBuffer();
	sql.append("(select distinct e.job_name as INNER_JOB_NAME , e.job_id as INNER_JOB_ID ");
	sql.append("from shifter.shf_employees e ");
	sql.append("left join shf_shift_inforce_inner_job t on t.inner_job_id= e.job_id ");
	sql.append("where t.shift_inforce_id=?) union ");
	sql.append("(select u.inner_job_name INNER_JOB_NAME , u.inner_job_id As INNER_JOB_ID ");
	sql.append("from shifter.shf_inner_jobs u ");
	sql.append("left join shf_shift_inforce_inner_job t on t.inner_job_id= u.inner_job_id ");
	sql.append("where t.shift_inforce_id=?)");
	DBAccess db=null;
	try{
		db=new DBAccess();
		db.prepareStatement(sql.toString());
		db.setInt(1,req.getId());
		db.setInt(2,req.getId());
		db.executeQuery();
		
		while(db.next()){
			innerJobInfo=new InnerJobBean();
            db.populate(innerJobInfo);
            innerJobVec.add(innerJobInfo);
		}
		


	}catch(DBQueryNoRowsException e){
		innerJobInfo=new InnerJobBean();
		innerJobInfo.setInnerJobId(0);
		innerJobVec.add(innerJobInfo);
        
		
	}catch(DBException e){
		logger.error("error in populateAddRequestJob() : "+e.getMessage());
		ActionErrors actionErrors = new ActionErrors();
		actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
		throw new ShfException(actionErrors);				
	}finally{
		try {
			sql=null;
			db.close();
			if (!innerJobVec.isEmpty()){
				req.setInnerJobBean((InnerJobBean[])innerJobVec.toArray(new InnerJobBean[innerJobVec.size()]));
			}
		} catch (DBException e) {
			logger.error("error in populateAddRequestJob() while closing db connection : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}
	}
}
	
	
	public Vector populateShiftAddRequests() throws ShfException{
		logger.debug("Starting populateShiftAddRequests()");
		StringBuffer sql=new StringBuffer();
		sql.append("SELECT ");
		sql.append("t.SHIFT_INFORCE_ID, ");
		sql.append("t.SHIFT_DATE, ");
		sql.append("t.SHIFT_START, ");
		sql.append("t.SHIFT_END, ");
		sql.append("t.AGENTS_NUMBER, ");
		sql.append("t.ORIGINAL_AGENTS_NUMBER, ");
		sql.append("t.SKILL_ID, ");
		sql.append("t.MOKED_ID, ");
		sql.append("t.ACTIVITY_TYPE_ID, ");
		sql.append("t.CREATION_TIME, ");
		sql.append("t.BREAKS_NUMBER, ");
		sql.append("t.FIRST_BREAK_TIME, ");
		sql.append("t.FIRST_BREAK_LENGTH, ");
		sql.append("t.SECOND_BREAK_TIME, ");
		sql.append("t.SECOND_BREAK_LENGTH, ");
		sql.append("t.THIRD_BREAK_TIME, ");
		sql.append("t.THIRD_BREAK_LENGTH, ");
		sql.append("t.MODIFICATION_USER, ");
		sql.append("t.MODIFICATION_TIME, ");
		sql.append("t.JOB_CATAGORY_TYPE, ");
		sql.append("t.WORK_FROM_HOME, ");
		sql.append("t.TRADITIONAL, ");
		sql.append("t.REMARK ");
		sql.append("FROM SHIFTER.SHF_SHIFT_INFORCE_REQ t where t.SHIFT_START > ? ");
		sql.append("AND t.MOKED_ID IN (");
		Vector allowed=shiftInforce.getAllowedUnits();
		for(int i=0;i<allowed.size();i++){
			sql.append((String)allowed.get(i));
			if(i<allowed.size()-1)
				sql.append(",");
		}
		sql.append(")  order by t.SHIFT_START ");
		DBAccess db=null;
		try{
			db=new DBAccess();
			
			db.prepareStatement(sql.toString());
			//Date date = new Date();
			//date.setTime(date.getTime()-(24*360*1000*300));
			db.setDate(1,new Date());
			
			//db.setDate(1,date);
			db.executeQuery();
			Vector vec=new Vector();
			db.populate("bzq.shf.forms.ShiftInforceRequestForm",vec);
			return vec;
		} catch(DBQueryNoRowsException e){
			
		} catch (DBException e) {
			logger.error("error in populateShiftAddRequests() : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.populateFailed", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				sql=null;
				db.close();
			} catch (DBException e) {
				logger.error("error in populateShiftAddRequests() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
		return null;
	}
	
	public void deleteShiftAddRequest(DBAccess db) throws ShfException{
		
		logger.debug("Starting deleteShiftAddRequest()");
		
		try{
			StringBuffer sql=new StringBuffer();
			sql.append("DELETE SHIFTER.SHF_SHIFT_INFORCE_REQ ");
			sql.append("WHERE SHIFT_INFORCE_ID=?");
			db.prepareStatement(sql.toString());
			db.setInt(1,shiftInforce.getId());
			db.executeUpdate();
		} catch (DBException e) {
			logger.error("error in deleteShiftAddRequest() : "+e.getMessage());
			/*try {
				db.rollback();
			} catch (DBException err) {
				logger.error("error in rollbackDeleteShiftAddRequest() while closing db connection : "+err.getMessage());
			}*/
			
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.updateFailed", null));
			throw new ShfException(actionErrors);
		}
			
		
	}
public void deleteShiftAddRequestTeam(DBAccess db) throws ShfException{
		
	logger.debug("Starting deleteShiftAddRequestTeam()");
		try{
			StringBuffer sql=new StringBuffer();
			int param_ind=1;
			sql.append("DELETE SHIFTER.SHF_SHIFT_INFORCE_TEAM ");
			sql.append("WHERE SHIFT_INFORCE_ID= ?");
			db.prepareStatement(sql.toString());
			db.setInteger(param_ind++,shiftInforce.getId());
			db.executeUpdate();
		}catch(DBUpdateNoRowsException e){
			logger.error("error at deleteShiftAddRequestTeam()  no row  to delete: "+e.getMessage());
		
		}catch(DBException e) {
				logger.error("error in deleteShiftAddRequestTeam() : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.updateFailed", null));
				throw new ShfException(actionErrors);
			}
		}
	
		
	public void deleteShiftAddRequestInnerJob(DBAccess db) throws ShfException{
	
		logger.debug("Starting deleteShiftAddRequestInnerJob()");
		try{
			StringBuffer sql=new StringBuffer();
			int param_ind=1;
			sql.append("DELETE SHIFTER.SHF_SHIFT_INFORCE_INNER_JOB ");
			sql.append("WHERE SHIFT_INFORCE_ID= ?");
			db.prepareStatement(sql.toString());
			db.setInteger(param_ind++,shiftInforce.getId());
			db.executeUpdate();
			}catch(DBUpdateNoRowsException e){
				logger.error("error at deleteShiftAddRequestInnerJob()  no row  to delete: "+e.getMessage());
			}catch(DBException e) {
				logger.error("error in deleteShiftAddRequestInnerJob()   : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.updateFailed", null));
				throw new ShfException(actionErrors);
		}
	}

		
	
	private void checkInforceBreaks() throws ShfException{
		
		logger.debug("Starting checkInforceBreaks()");
		ShiftBreakForm breakForm=new ShiftBreakForm();
		breakForm.setBreaksNumber(shiftInforce.getBreaksNumber());
		breakForm.setFirstBreakTime(shiftInforce.getFirstBreakTime());
		breakForm.setFirstBreakLength(shiftInforce.getFirstBreakLength());
		breakForm.setSecondBreakTime(shiftInforce.getSecondBreakTime());
		breakForm.setSecondBreakLength(shiftInforce.getSecondBreakLength());
		breakForm.setThirdBreakTime(shiftInforce.getThirdBreakTime());
		breakForm.setThirdBreakLength(shiftInforce.getThirdBreakLength());
		
		BreakDataModel.checkShiftBreakForm(breakForm,shiftInforce.getShiftStart(),shiftInforce.getShiftEnd(),0,true);
		
	}
	// לבדוק את הפונקציה עם תמר
//	public void updateShiftAddRequest() throws ShfException{
//		logger.debug("Starting updateShiftAddRequest()");
//		checkInforceBreaks();
//		int param_ind=1;
//		
//		Date break1=null;
//		Date break2=null;
//		Date break3=null;
//			
//		try{
//			int num=shiftInforce.getBreaksNumber();
//			if(num>0){ 
//				break1=BaseConvert.stringToDate(BaseConvert.dateToString(shiftInforce.getDate(),"dd/MM/yyyy")+" "+shiftInforce.getFirstBreakTime(),"dd/MM/yyyy HH:mm"); 
//			}
//			if(num>1){ 
//				break2=BaseConvert.stringToDate(BaseConvert.dateToString(shiftInforce.getDate(),"dd/MM/yyyy")+" "+shiftInforce.getSecondBreakTime(),"dd/MM/yyyy HH:mm"); 
//			}
//			if(num>2){ 
//				break3=BaseConvert.stringToDate(BaseConvert.dateToString(shiftInforce.getDate(),"dd/MM/yyyy")+" "+shiftInforce.getThirdBreakTime(),"dd/MM/yyyy HH:mm"); 
//			}
//		}catch(ConvertException e){
//			logger.error("error in addShiftAddRequest() while converting Date : "+e.getMessage());
//			ActionErrors actionErrors = new ActionErrors();
//			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
//			throw new ShfException(actionErrors);
//		}
//		
//		StringBuffer sql=new StringBuffer();
//		DBAccess db=null;
//		try{
//			db=new DBAccess();
//			
//			sql.append("UPDATE SHIFTER.SHF_SHIFT_INFORCE_REQ SET ");
//			//sql.append("SHIFT_DATE=?,");
//			//sql.append("SHIFT_START=?,");
//			//sql.append("SHIFT_END=?,");
//			//sql.append("AGENTS_NUMBER=AGENTS_NUMBER+(?-ORIGINAL_AGENTS_NUMBER),");
//			sql.append("ORIGINAL_AGENTS_NUMBER=?,");
//			//sql.append("SKILL_ID=?,");
//			//sql.append("ACTIVITY_TYPE_ID=?,");
//			//sql.append("BREAKS_NUMBER=?, ");
//			//sql.append("FIRST_BREAK_TIME=?, ");
//			//sql.append("FIRST_BREAK_LENGTH=?, ");
//			//sql.append("SECOND_BREAK_TIME=?, ");
//			//sql.append("SECOND_BREAK_LENGTH=?, ");
//			//sql.append("THIRD_BREAK_TIME=?, ");
//			//sql.append("THIRD_BREAK_LENGTH=?, ");
//			sql.append("REMARK=?, ");
//			sql.append("MODIFICATION_USER=?,");
//			sql.append("MODIFICATION_TIME=? ");
//			sql.append("WHERE SHIFT_INFORCE_ID=?");
//			db.prepareStatement(sql.toString());
////			db.setDate(1,new Date());
////			db.executeQuery();
////			Vector vec=new Vector();
////			db.populate("bzq.shf.forms.ShiftInforceRequestForm",vec);
////// לבדוק עם תמר			
//////			return vec;
////		} catch(DBQueryNoRowsException e){
//			
//			//db.setDate(param_ind++,shiftInforce.getDate());
//			//db.setTimestamp(param_ind++,shiftInforce.getShiftStart());
//			//db.setTimestamp(param_ind++,shiftInforce.getShiftEnd());
//			//db.setInt(param_ind++,shiftInforce.getOriginalNumOfAgents());
//			db.setInt(param_ind++,shiftInforce.getOriginalNumOfAgents());
//			//db.setInt(param_ind++,shiftInforce.getSkill());
//			//db.setString(param_ind++,shiftInforce.getActivity());
//			//db.setInt(param_ind++,shiftInforce.getBreaksNumber());
//			//db.setTimestamp(param_ind++,break1);
//			//db.setInt(param_ind++,shiftInforce.getFirstBreakLength());
//			//db.setTimestamp(param_ind++,break2);
//			//db.setInt(param_ind++,shiftInforce.getSecondBreakLength());
//			//db.setTimestamp(param_ind++,break3);
//			//db.setInt(param_ind++,shiftInforce.getThirdBreakLength());
//			db.setString(param_ind++,shiftInforce.getRemark());
//			db.setString(param_ind++,shiftInforce.getUserFirstName()+" "+shiftInforce.getUserLastName());
//			db.setTimestamp(param_ind++,new Date());
//			db.setInt(param_ind++,shiftInforce.getId());
//			
//			db.executeUpdate();
//		} catch (DBException e) {
//			logger.error("error in updateShiftAddRequest() : "+e.getMessage());
//			ActionErrors actionErrors = new ActionErrors();
//			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.updateFailed", null));
//			throw new ShfException(actionErrors);
//		} finally{
//			try {
//				sql=null;
//				db.close();
//			} catch (DBException e) {
//				logger.error("error in updateShiftAddRequest() while closing db connection : "+e.getMessage());
//				ActionErrors actionErrors = new ActionErrors();
//				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
//				throw new ShfException(actionErrors);
//			}
//		}
//	}
//	
	
	
	public void updateShiftAddRequest() throws ShfException{
		logger.debug("Starting updateShiftAddRequest()");
		checkInforceBreaks();
		int param_ind=1;
		Date break1=null;
		Date break2=null;
		Date break3=null;
		Date date=shiftInforce.getDate();
		String datestr=BaseConvert.dateToString(date,"dd/MM/yyyy");
		String startstr=BaseConvert.dateToString(shiftInforce.getShiftStart(),"HH:mm");
		String endstr=BaseConvert.dateToString(shiftInforce.getShiftEnd(),"HH:mm");
		Date shiftStart=null,shiftEnd=null;
				
		try{
		shiftStart=BaseConvert.stringToDate(datestr + " " + startstr,"dd/MM/yyyy HH:mm");
		shiftEnd=BaseConvert.stringToDate(datestr + " " + endstr,"dd/MM/yyyy HH:mm");
		
		int num=shiftInforce.getBreaksNumber();
		if(num>0){ 
		break1=BaseConvert.stringToDate(BaseConvert.dateToString(shiftInforce.getDate(),"dd/MM/yyyy")+" "+shiftInforce.getFirstBreakTime(),"dd/MM/yyyy HH:mm"); 
		}
		if(num>1){ 
		break2=BaseConvert.stringToDate(BaseConvert.dateToString(shiftInforce.getDate(),"dd/MM/yyyy")+" "+shiftInforce.getSecondBreakTime(),"dd/MM/yyyy HH:mm"); 
		}
		if(num>2){ 
		break3=BaseConvert.stringToDate(BaseConvert.dateToString(shiftInforce.getDate(),"dd/MM/yyyy")+" "+shiftInforce.getThirdBreakTime(),"dd/MM/yyyy HH:mm"); 
		}
		}catch(ConvertException e){
		logger.error("error in addShiftAddRequest() while converting Date : "+e.getMessage());
		ActionErrors actionErrors = new ActionErrors();
		actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
		throw new ShfException(actionErrors);
		}
		StringBuffer sql=new StringBuffer();
		DBAccess db=null;
		try{
		db=new DBAccess();
		sql.append("UPDATE SHIFTER.SHF_SHIFT_INFORCE_REQ SET ");
		sql.append("SHIFT_DATE=?,");
		sql.append("SHIFT_START=?,");
		sql.append("SHIFT_END=?,");
		//sql.append("AGENTS_NUMBER=AGENTS_NUMBER+(?-ORIGINAL_AGENTS_NUMBER),");
		sql.append("ORIGINAL_AGENTS_NUMBER=?,");
		//sql.append("SKILL_ID=?,");
		sql.append("ACTIVITY_TYPE_ID=?,");
		sql.append("BREAKS_NUMBER=?, ");
		sql.append("FIRST_BREAK_TIME=?, ");
		sql.append("FIRST_BREAK_LENGTH=?, ");
		sql.append("SECOND_BREAK_TIME=?, ");
		sql.append("SECOND_BREAK_LENGTH=?, ");
		sql.append("THIRD_BREAK_TIME=?, ");
		sql.append("THIRD_BREAK_LENGTH=?, ");
		sql.append("REMARK=?, ");
		sql.append("MODIFICATION_USER=?,");
		sql.append("MODIFICATION_TIME=? ");
		sql.append("WHERE SHIFT_INFORCE_ID=?");
		db.prepareStatement(sql.toString());
		db.setDate(param_ind++,shiftInforce.getDate());
		db.setTimestamp(param_ind++,shiftStart);
		db.setTimestamp(param_ind++,shiftEnd);
		//db.setInt(param_ind++,shiftInforce.getOriginalNumOfAgents());
		db.setInt(param_ind++,shiftInforce.getOriginalNumOfAgents());
		//db.setInt(param_ind++,shiftInforce.getSkill());
		db.setString(param_ind++,shiftInforce.getActivity());
		db.setInt(param_ind++,shiftInforce.getBreaksNumber());
		db.setTimestamp(param_ind++,break1);
		db.setInt(param_ind++,shiftInforce.getFirstBreakLength());
		db.setTimestamp(param_ind++,break2);
		db.setInt(param_ind++,shiftInforce.getSecondBreakLength());
		db.setTimestamp(param_ind++,break3);
		db.setInt(param_ind++,shiftInforce.getThirdBreakLength());
		db.setString(param_ind++,shiftInforce.getRemark());
		db.setString(param_ind++,shiftInforce.getUserFirstName()+" "+shiftInforce.getUserLastName());
		db.setTimestamp(param_ind++,new Date());
		db.setInt(param_ind++,shiftInforce.getId());
		db.executeUpdate();
		} catch (DBException e) {
		logger.error("error in updateShiftAddRequest() : "+e.getMessage());
		ActionErrors actionErrors = new ActionErrors();
		actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.updateFailed", null));
		throw new ShfException(actionErrors);
		} finally{
		try {
		sql=null;
		db.close();
		} catch (DBException e) {
		logger.error("error in updateShiftAddRequest() while closing db connection : "+e.getMessage());
		ActionErrors actionErrors = new ActionErrors();
		actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
		throw new ShfException(actionErrors);
		}
		}
		}
	public void updateShiftAddRequestNum() throws ShfException{
		logger.debug("Starting updateShiftAddRequest()");
		checkInforceBreaks();
		int param_ind=1;
		Date break1=null;
		Date break2=null;
		Date break3=null;
						
		try{
		
		int num=shiftInforce.getBreaksNumber();
		if(num>0){ 
		break1=BaseConvert.stringToDate(BaseConvert.dateToString(shiftInforce.getDate(),"dd/MM/yyyy")+" "+shiftInforce.getFirstBreakTime(),"dd/MM/yyyy HH:mm"); 
		}
		if(num>1){ 
		break2=BaseConvert.stringToDate(BaseConvert.dateToString(shiftInforce.getDate(),"dd/MM/yyyy")+" "+shiftInforce.getSecondBreakTime(),"dd/MM/yyyy HH:mm"); 
		}
		if(num>2){ 
		break3=BaseConvert.stringToDate(BaseConvert.dateToString(shiftInforce.getDate(),"dd/MM/yyyy")+" "+shiftInforce.getThirdBreakTime(),"dd/MM/yyyy HH:mm"); 
		}
		}catch(ConvertException e){
		logger.error("error in addShiftAddRequest() while converting Date : "+e.getMessage());
		ActionErrors actionErrors = new ActionErrors();
		actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
		throw new ShfException(actionErrors);
		}
		StringBuffer sql=new StringBuffer();
		DBAccess db=null;
		try{
		db=new DBAccess();
		sql.append("UPDATE SHIFTER.SHF_SHIFT_INFORCE_REQ SET ");
		sql.append("ORIGINAL_AGENTS_NUMBER=?,");
		sql.append("REMARK=?, ");
		sql.append("MODIFICATION_USER=?,");
		sql.append("MODIFICATION_TIME=? ");
		sql.append("WHERE SHIFT_INFORCE_ID=?");
		db.prepareStatement(sql.toString());
		db.setInt(param_ind++,shiftInforce.getOriginalNumOfAgents());
		db.setString(param_ind++,shiftInforce.getRemark());
		db.setString(param_ind++,shiftInforce.getUserFirstName()+" "+shiftInforce.getUserLastName());
		db.setTimestamp(param_ind++,new Date());
		db.setInt(param_ind++,shiftInforce.getId());
		db.executeUpdate();
		} catch (DBException e) {
		logger.error("error in updateShiftAddRequestNum() : "+e.getMessage());
		ActionErrors actionErrors = new ActionErrors();
		actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.updateFailed", null));
		throw new ShfException(actionErrors);
		} finally{
		try {
		sql=null;
		db.close();
		} catch (DBException e) {
		logger.error("error in updateShiftAddRequestNum() while closing db connection : "+e.getMessage());
		ActionErrors actionErrors = new ActionErrors();
		actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
		throw new ShfException(actionErrors);
		}
		}
		}

	
	
	
	
	
	public void addShiftAddRequest() throws ShfException{
		checkInforceBreaks();

		DBAccess db=null;
		db=new DBAccess();
		Integer nextVal = this.findNextVal(db);
		insertInforceReq(db,shiftInforce,nextVal);
		if (shiftInforce.getTeam()!=null && !shiftInforce.getTeam()[0].equals("00")){
			insertInforceTeam(db,shiftInforce,nextVal);
		}
		if (shiftInforce.getInnerJob()!=null && !shiftInforce.getInnerJob()[0].equals("00")){
			insertInforceInnerJob(db,shiftInforce,nextVal);
		}
		
		try{
			db.close();
		
		} catch (DBException e) {
			logger.error("error in addShiftAddRequest() while closing db connection : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}
		
	}
	public int  findNextVal(DBAccess db) throws ShfException {
		logger.debug("Starting findNextVal()" );
		int nextValInt =0;
		StringBuffer sql=new StringBuffer();
		sql.append("select SHIFTER.SHF_SHIFT_INFORCE_ID.NEXTVAL FROM DUAL");
		try {
			db.prepareStatement(sql.toString());
			db.executeQuery();
		if(db.next()){	
			nextValInt=db.getInt(1);
		}	
		} catch (DBException e) {
			logger.error("error in findNextVal() : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}
		return nextValInt; 
		
	}
	public static void insertInforceReq(DBAccess db, ShiftInforceRequestForm shiftInforce, int nextVal ) throws ShfException {

		Date break1=null;
		Date break2=null;
		Date break3=null;
		boolean workFromHome = true;
		boolean traditional = true;
		boolean categoryJob = true;
			
		int param_ind=1;
		
		try{
			int num=shiftInforce.getBreaksNumber();
			if(num>0){ 
				break1=BaseConvert.stringToDate(BaseConvert.dateToString(shiftInforce.getDate(),"dd/MM/yyyy")+" "+shiftInforce.getFirstBreakTime(),"dd/MM/yyyy HH:mm"); 
			}
			if(num>1){ 
				break2=BaseConvert.stringToDate(BaseConvert.dateToString(shiftInforce.getDate(),"dd/MM/yyyy")+" "+shiftInforce.getSecondBreakTime(),"dd/MM/yyyy HH:mm"); 
			}
			if(num>2){ 
				break3=BaseConvert.stringToDate(BaseConvert.dateToString(shiftInforce.getDate(),"dd/MM/yyyy")+" "+shiftInforce.getThirdBreakTime(),"dd/MM/yyyy HH:mm"); 
			}
		}catch(ConvertException e){
			logger.error("error in addShiftAddRequest() while converting Date : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}
		
	
		workFromHome  = shiftInforce.getWorkFromHome() == 0? false:true;
		traditional  = shiftInforce.getTrained() == 0? false:true;
		categoryJob  = shiftInforce.getCategoryJob() == 0? false:true;
		StringBuffer sql=new StringBuffer();
		try{
			sql.append("INSERT INTO SHIFTER.SHF_SHIFT_INFORCE_REQ(");
			sql.append("SHIFT_INFORCE_ID,");
			sql.append("SHIFT_DATE,");
			sql.append("SHIFT_START,");
			sql.append("SHIFT_END,");
			sql.append("AGENTS_NUMBER,");
			sql.append("ORIGINAL_AGENTS_NUMBER,");
			sql.append("SKILL_ID,");
			sql.append("MOKED_ID,");
			sql.append("ACTIVITY_TYPE_ID, ");
			
			sql.append("BREAKS_NUMBER, ");
			sql.append("FIRST_BREAK_TIME, ");
			sql.append("FIRST_BREAK_LENGTH, ");
			sql.append("SECOND_BREAK_TIME, ");
			sql.append("SECOND_BREAK_LENGTH, ");
			sql.append("THIRD_BREAK_TIME, ");
			sql.append("THIRD_BREAK_LENGTH, ");
			
			sql.append("MODIFICATION_USER,");
			sql.append("MODIFICATION_TIME,");
			sql.append("CREATION_TIME, ");
			if(traditional){
				sql.append("TRADITIONAL, ");
			}
			if(categoryJob){
				sql.append("JOB_CATAGORY_TYPE, ");
			}
			if(workFromHome){
				sql.append("WORK_FROM_HOME, ");
			}	
			sql.append("REMARK )");
			sql.append("VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,");
			if(traditional){
				sql.append("?,");
			}
			if(categoryJob){
				sql.append("?,");
			}
			if(workFromHome){
				sql.append("?,");
			}	
			sql.append("?)");
			db.prepareStatement(sql.toString());
			db.setInteger(param_ind++, nextVal);
			db.setDate(param_ind++,shiftInforce.getDate());
			db.setTimestamp(param_ind++,shiftInforce.getShiftStart());
			db.setTimestamp(param_ind++,shiftInforce.getShiftEnd());
			db.setInt(param_ind++,shiftInforce.getOriginalNumOfAgents());
			db.setInt(param_ind++,shiftInforce.getOriginalNumOfAgents());
			db.setInt(param_ind++,shiftInforce.getSkill());
			db.setString(param_ind++,shiftInforce.getMoked());
			db.setString(param_ind++,shiftInforce.getActivity());
			
			
			db.setInt(param_ind++,shiftInforce.getBreaksNumber());
			db.setTimestamp(param_ind++,break1);
			db.setInt(param_ind++,shiftInforce.getFirstBreakLength());
			db.setTimestamp(param_ind++,break2);
			db.setInt(param_ind++,shiftInforce.getSecondBreakLength());
			db.setTimestamp(param_ind++,break3);
			db.setInt(param_ind++,shiftInforce.getThirdBreakLength());
			
			db.setString(param_ind++,shiftInforce.getUserFirstName()+" "+shiftInforce.getUserLastName());
			db.setTimestamp(param_ind++,new Date());
			db.setTimestamp(param_ind++,new Date());
			if(traditional){
				db.setString(param_ind++,"1");
			}
			if(categoryJob){
				db.setInt(param_ind++,shiftInforce.getCategoryJob());
			}
			if(workFromHome){
				db.setString(param_ind++,"1");
			}	
			db.setString(param_ind, shiftInforce.getRemark());
			db.executeUpdate();
		} catch (DBException e) {
			logger.error("error in addShiftAddRequest() : "+e.getMessage());			
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.insertFailed", null));
			throw new ShfException(actionErrors);
		}
	}

	public static void insertInforceTeam(DBAccess db ,ShiftInforceRequestForm  shiftInforce, Integer nextVal) throws  ShfException{
		logger.debug("Starting insertInforceTeam() shiftInforce= " + shiftInforce );

		//StringBuffer sql=new StringBuffer();
		
		for (int i=0;i<shiftInforce.getTeam().length;i++){
			try{
			StringBuffer sql=new StringBuffer();
			int param_ind=1;
			sql.append("INSERT INTO SHIFTER.SHF_SHIFT_INFORCE_TEAM(");
			sql.append("ORG_UNIT_ID,");
			sql.append("SHIFT_INFORCE_ID,");
			sql.append("MODIFICATION_USER,");
			sql.append("MODIFICATION_TIME)");
			
			sql.append("VALUES(?,?,?,?)");
			db.prepareStatement(sql.toString());
			db.setString(param_ind++,shiftInforce.getTeam()[i]);
			db.setInteger(param_ind++, nextVal);
			db.setString(param_ind++, shiftInforce.getUserId());
			db.setDate(param_ind++, shiftInforce.getDate());
			db.executeUpdate();
			}catch(DBException e) {
				logger.error("error in insertInforceTeam()  : "+e.getMessage());
				try {
					db.rollback();
				} catch (DBException e2) {
					logger.error("error in insertInforceTeam() while rollbback: "+e2.getMessage());
				}
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
	}
	public static void insertInforceInnerJob(DBAccess db ,ShiftInforceRequestForm  shiftInforce, Integer nextVal) throws  ShfException{
		logger.debug("Starting rollbackInsertInforceInnerJob() shiftInforce= " + shiftInforce );

		
		for (int i=0;i<shiftInforce.getInnerJob().length;i++){
			try{
			StringBuffer sql=new StringBuffer();
			int param_ind=1;
			sql.append("INSERT INTO SHIFTER.SHF_SHIFT_INFORCE_INNER_JOB(");
			sql.append("INNER_JOB_ID,");
			sql.append("SHIFT_INFORCE_ID,");
			sql.append("MODIFICATION_USER,");
			sql.append("MODIFICATION_TIME)");
			
			sql.append("VALUES(?,?,?,?)");
			db.prepareStatement(sql.toString());
			db.setString(param_ind++,shiftInforce.getInnerJob()[i]);
			db.setInteger(param_ind++, nextVal);
			db.setString(param_ind++, shiftInforce.getUserId());
			db.setDate(param_ind++, shiftInforce.getDate());
			db.executeUpdate();
			}catch(DBException e) {
				logger.error("error in insertInforceInnerJob()  : "+e.getMessage());
				try {
					db.rollback();
				} catch (DBException e2) {
					logger.error("error in rollbackInsertInforceInnerJob() while rollbback: "+e2.getMessage());
				}
				
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
	}
	public Vector searchAddOptions() throws ShfException {
			logger.debug("Starting addShiftAddRequest()");
			Vector vec=getAddOptions();
			populateAddedDays(vec);
			return vec;
	}
	
	public Vector getAddOptions() throws ShfException {
		logger.debug("Starting getAddOptions() userId = " + shiftInforce.getUserId());
		Vector vec=null;
		int param_ind=1;
//		String team = null;
//		if (shiftInforce.getOrgUnitBean()!=null){
//			for(int i=0;i<shiftInforce.getOrgUnitBean().length;i++){
//				
//			team=team+shiftInforce.getOrgUnitBean()[i]; 
//			if(i<shiftInforce.getOrgUnitBean().length-1){
//				team=team+',';
//			}
//		  }	
//		}
//		String innerJob = null;
//		if(shiftInforce.getInnerJob()!=null){
//			for(int i=0;i<shiftInforce.getInnerJob().length;i++){
//			innerJob=innerJob+shiftInforce.getInnerJob()[i]; 
//			if(i<shiftInforce.getInnerJob().length-1){
//				innerJob=innerJob+',';
//			}
//		  }	
//		}
		StringBuffer sql=new StringBuffer();
		sql.append(" select t.* from SHIFTER.shf_shift_inforce_req t ");
		sql.append("left join SHIFTER.shf_activity_type a on a.activity_type_id=t.activity_type_id ");
		sql.append("left join SHIFTER.shf_activity_skill x on x.activity_type_id=a.activity_type_id ");
		sql.append("where t.skill_id IN  ");
		sql.append("(select s.skill_id from SHIFTER.shf_employee_skills s where s.skill_level>0 and s.emp_id_number=?) "); //1
		sql.append("and x.skill_id IN ");
		sql.append("(select s.skill_id from SHIFTER.shf_employee_skills s where s.skill_level>0 and s.emp_id_number=?) "); //2
		//tamar-inforceReq - 06/07/2011
		//sql.append("AND t.SHIFT_START > ? AND t.MOKED_ID = ? ORDER BY t.SHIFT_START ");
		sql.append("AND t.SHIFT_START > ? AND t.MOKED_ID = ?  "); //3,4
		sql.append("union all ");
		sql.append("select  t.* from SHIFTER.shf_shift_inforce_req t ");
		sql.append("left join SHIFTER.shf_activity_type a on a.activity_type_id=t.activity_type_id ");
		sql.append("full join SHIFTER.shf_shift_inforce_team  team on t.SHIFT_INFORCE_ID=team.SHIFT_INFORCE_ID  " );
		sql.append("full join SHIFTER.shf_shift_inforce_inner_job  job on t.SHIFT_INFORCE_ID=job.SHIFT_INFORCE_ID  " );
		sql.append("where t.SHIFT_START > ? AND t.MOKED_ID = ?  and t.skill_id = 0  "); //5,6
		sql.append("and( t.TRADITIONAL is null or t.TRADITIONAL= ?) ");//7
		sql.append("and (t.JOB_CATAGORY_TYPE in (select c.CATEGORY_ID from SHIFTER.SHF_CATEGORY_JOB  c ");
		sql.append("left join SHIFTER.SHF_EMPLOYEES e on c.JOB_ID= e.JOB_ID where e.emp_id_number= ?) "); //8
		sql.append(" or t.JOB_CATAGORY_TYPE is null) ");
		sql.append("and (team.ORG_UNIT_ID is null or team.ORG_UNIT_ID in (select e.ORG_UNIT_ID from  ");
		sql.append("SHIFTER.SHF_EMPLOYEES e where  e.emp_id_number= ? )) "); //9
		sql.append("and (job.INNER_JOB_ID is null or job.INNER_JOB_ID in(select e.INNER_JOB_ID from ");
		sql.append("SHIFTER.SHF_EMPLOYEES e where  e.emp_id_number= ? ))"); //10
		//tamar-inforceReq - 06/07/2011
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setString(param_ind++,shiftInforce.getUserId().substring(0,8)); 
			db.setString(param_ind++,shiftInforce.getUserId().substring(0,8)); 
			db.setTimestamp(param_ind++,new Date()); //
			db.setString(param_ind++,shiftInforce.getAllowedMoked());
			db.setTimestamp(param_ind++,new Date());
			db.setString(param_ind++,shiftInforce.getAllowedMoked());
			db.setInt(param_ind++,shiftInforce.getTrained());
			db.setString(param_ind++,shiftInforce.getUserId());
			db.setString(param_ind++,shiftInforce.getUserId());
			db.setString(param_ind++,shiftInforce.getUserId());
			
			
			
			db.executeQuery();
			vec=new Vector();
			db.populate("bzq.shf.forms.ShiftInforceRequestForm",vec);
			return vec;
		} catch(DBQueryNoRowsException e){
	
		} catch (DBException e) {
			logger.error("error in searchAddOptions() : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.populateFailed", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				sql=null;
				db.close();
			} catch (DBException e) {
				logger.error("error in searchAddOptions() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
		return null;
	}
	
	public void shiftChangeInsert(DBAccess db) throws ShfException{
		//TODO - HASAVA - shiftChangeInsert - D
		logger.debug("Starting shiftChangeInsert() ");
		int param_ind=1;
		String currentUserName = shiftForm.getUserFirstName()+" "+shiftForm.getUserLastName();
		String endChangeReason = ((ShiftDataForm)shiftForm).getNewEndStatusForUpdate();
		String startChangeReason = ((ShiftDataForm)shiftForm).getNewStartStatusForUpdate();
		long agentDayId = ((ShiftDataForm)shiftForm).getAgentDayId();

		Date newStartDate = null;
		Date newEndDate = null;
		Date newSplitStartDate = null;
		Date newSplitEndDate = null;
		String oldShiftLocation = shiftForm.isWorkingFromHome() ? SHFConstants.SHIFT_LOCATION_HOME : SHFConstants.SHIFT_LOCATION_SITE;
		String sNewStartDate = null;
		String sNewEndDate = null;
		boolean startDate = true;
		boolean endDate = true;
		boolean splitStartDate = false;
		boolean splitEndDate = false;
		boolean shiftLocation = true;
		
		
		try {
			newStartDate = BaseConvert.stringToDate( sNewStartDate = BaseConvert.dateToString(((ShiftDataForm)shiftForm).getNewStartDate(),"dd/MM/yyyy")  + " " + ((ShiftDataForm)shiftForm).getNewStartTime(), "dd/MM/yyyy HH:mm");
			newEndDate = BaseConvert.stringToDate( sNewEndDate  = BaseConvert.dateToString(((ShiftDataForm)shiftForm).getNewEndDate(),"dd/MM/yyyy") + " " + ((ShiftDataForm)shiftForm).getNewEndTime(), "dd/MM/yyyy HH:mm");
			
			if (shiftForm.isShiftSplit()) {
				newSplitStartDate = BaseConvert.stringToDate( sNewStartDate = BaseConvert.dateToString(((ShiftDataForm)shiftForm).getNewStartDate(),"dd/MM/yyyy")  + " " + ((ShiftDataForm)shiftForm).getNewSplitStartTime(), "dd/MM/yyyy HH:mm");
				newSplitEndDate = BaseConvert.stringToDate( sNewEndDate  = BaseConvert.dateToString(((ShiftDataForm)shiftForm).getNewEndDate(),"dd/MM/yyyy") + " " + ((ShiftDataForm)shiftForm).getNewSplitEndTime(), "dd/MM/yyyy HH:mm");
			}
			
		} catch (ConvertException e) {
			//throw new ShfException("Error convert String to Date : shiftChangeInsertEnd  - " + e1);
			e.printStackTrace();
			logger.error("error in shiftChangeInsert() while convert String to Date : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);			
		}
		
		
		CheckValidDate checkDate = new CheckValidDate(shiftForm);
		
		checkDate.setNewShiftStart(sNewStartDate);
		checkDate.setNewShiftEnd(sNewEndDate);
		checkDate.setEmpId(((ShiftDataForm)shiftForm).getEmpIdNumber());
		checkDate.setMoked(((ShiftDataForm)shiftForm).getMokedForCheck());
		//08.03.09 - check if new date for update is between current weekly arrangement  

		checkDate.checkValidDateBetweenShifts(); 
		
		//check if any change was made
		startDate  = newStartDate.compareTo(((ShiftDataForm)shiftForm).getShiftStart()) == 0? false:true;
		endDate = newEndDate.compareTo(((ShiftDataForm)shiftForm).getShiftEnd()) == 0?false:true;
		if (shiftForm.isShiftSplit()) {
			splitStartDate  = newSplitStartDate.compareTo(((ShiftDataForm)shiftForm).getSplitShiftStart()) == 0? false:true;
			splitEndDate = newSplitEndDate.compareTo(((ShiftDataForm)shiftForm).getSplitShiftEnd()) == 0?false:true;
		}
		shiftLocation = shiftForm.getShiftLocation() != null ? oldShiftLocation.equals(shiftForm.getShiftLocation()) ? false : true : false;
		
		if (! (endDate || startDate || shiftLocation || splitStartDate || splitEndDate) ) return; // no change made
		
		//HASAVA - start
		AgentDayBean agentDay = populateShift(agentDayId);
		//HASAVA - end
		
		StringBuffer sql=new StringBuffer();
//		DBAccess db=null;
				try{
//						db=new DBAccess(false);
						
						sql.append("INSERT INTO SHIFTER.SHF_DAY_CHANGES ");
						sql.append("(SHF_EMPLOYEE_DAY_ID, ");		// 1
						sql.append("MODIFICATION_USER, "); 			// 2
						sql.append("MODIFICATION_TIME, ");			// 3
						//HASAVA - start
						sql.append(" NEW_EMPLOYEE_ID ,"); 			// 4
						sql.append(" NEW_ACTIVITY ,"); 				// 5
						sql.append(" NEW_DAY_TYPE ,"); 				// 6
						sql.append(" NEW_EXCEPTION_TYPE_ID ,"); 	// 7
						sql.append(" NEW_PAID_MINUTES ,"); 			// 8
						sql.append(" NEW_SITE_ID ,"); 				// 9
						sql.append(" NEW_TIMEOFF_TYPE_ID ,"); 		// 10
						sql.append(" NEW_WORK_MINUTES "); 			// 11
						//HASAVA - end
						if (endDate){		
							sql.append(", END_CHANGE_REASON, ");	// 12
							sql.append("NEW_DAY_END, ");			// 13
							sql.append("NEW_SHIFT_END ");			// 14
						//HASAVA - start	
						} else {
							sql.append(", NEW_DAY_END, ");			// 15
							sql.append("NEW_SHIFT_END ");			// 16			
						}
						//HASAVA - end
						if (startDate){
							sql.append(", START_CHANGE_REASON, ");	// 17
							sql.append("NEW_DAY_START, ");			// 18
							sql.append("NEW_SHIFT_START ");			// 19
						//HASAVA - start
						} else {
							sql.append(", NEW_DAY_START, ");		// 20
							sql.append("NEW_SHIFT_START ");			// 21
						}
						
						sql.append(", NEW_WORK_FROM_HOME ");		// 22
						sql.append(", NEW_SPLIT_SHIFT ");			// 23
						
						if (shiftForm.isShiftSplit()) {
							sql.append(", NEW_SPLIT_START ");		// 24
							sql.append(", NEW_SPLIT_END ");			// 25
						}
						
						sql.append(", NEW_POOL_EXT_NUM ");		// 26
						sql.append(", NEW_POOL_ERR ");			// 27
						
						//HASAVA - end
						sql.append(" ) VALUES ");
						sql.append("(?, "); // 1
						sql.append("?, ");	// 2
						sql.append("?, ");	// 3
						//HASAVA - start
						sql.append("?, ");	// 4
						sql.append("?, ");	// 5
						sql.append("?, ");	// 6
						sql.append("?, ");	// 7
						sql.append("?, ");	// 8
						sql.append("?, ");	// 9
						sql.append("?, ");	// 10
						sql.append("? ");	// 11
						//HASAVA - end
						if (endDate) 
						{	
							sql.append(", ?, ");	// 12
							sql.append("?, ");		// 13
							sql.append("?  ");		// 14
						//HASAVA - start
						} else {
							sql.append(", ?, ");	// 15
							sql.append("? ");		// 16
						}
						//HASAVA - end
						if (startDate) 
						{	
							sql.append(", ?, ");	// 17
							sql.append("?, ");		// 18
							sql.append("? ");		// 19
						//HASAVA - start
						} else {
							sql.append(", ?, ");	// 20
							sql.append("? ");		// 21				
						}						
						//HASAVA - end	
						sql.append(",? ");			// 22
						sql.append(",? ");			// 23
						
						if (shiftForm.isShiftSplit()) {
							sql.append(",?, ? ");	// 24, 25
						}
						
						sql.append(", ?, ? ");		// 26, 27
						
						sql.append(" ) ");
							
						db.prepareStatement(sql.toString());
				
						db.setLong(param_ind++, agentDayId); //1
						db.setString(param_ind++, currentUserName); //2
						db.setTimestamp(param_ind++, new Date()); //3
						//HASAVA - start
						db.setString(param_ind++, agentDay.getEmpIdNumber()); //4
						db.setString(param_ind++, agentDay.getShiftActivity()); //5
						db.setInt(param_ind++, agentDay.getDayType()); //6
						db.setInt(param_ind++, agentDay.getWmExceptionId()); //7
						db.setInt(param_ind++, agentDay.getPaidMinutes()); //8
						db.setString(param_ind++, agentDay.getSiteId()); //9
						db.setInt(param_ind++, agentDay.getTimeoffTypeId()); //10
						db.setInt(param_ind++, agentDay.getWorkMinutes()); //11
						//HASAVA - end
						if (endDate){
							db.setString(param_ind++, endChangeReason);
							db.setTimestamp(param_ind++, newEndDate);
							db.setTimestamp(param_ind++, newEndDate);
						//HASAVA - start
						} else {
							db.setTimestamp(param_ind++, agentDay.getDayEnd());
							db.setTimestamp(param_ind++, agentDay.getShiftEnd());
						}
						//HASAVA - end
					if (startDate){
						db.setString(param_ind++, startChangeReason);
						db.setTimestamp(param_ind++, newStartDate);
						db.setTimestamp(param_ind++, newStartDate);
						//HASAVA - start
					} else {
						db.setTimestamp(param_ind++, agentDay.getDayStart());
						db.setTimestamp(param_ind++, agentDay.getShiftStart());
					}
					//HASAVA - end
					db.setString(param_ind++, shiftLocation ? shiftForm.getShiftLocation().equals(SHFConstants.SHIFT_LOCATION_HOME) ? "Y" : "N" : shiftForm.getWorkFromHome().toUpperCase());
					db.setString(param_ind++, shiftForm.isShiftSplit() ? "Y" : "N");
					
					if (shiftForm.isShiftSplit()) {
						db.setTimestamp(param_ind++, newSplitStartDate);
						db.setTimestamp(param_ind++, newSplitEndDate);
					}
					
					db.setString(param_ind++, agentDay.getPoolExtNum());
					db.setString(param_ind++, agentDay.getPoolErr());
					
					db.executeUpdate();		
					changeShiftSource(db,agentDayId,"SHF","WFM");
//					db.commit();	// Disabled for managed breaks
			
			}catch (DBException nrE){
//				try {
//					db.rollback();
//				} catch (DBException e2) {
//					logger.error("error in shiftChangeInsert() while rollbback: "+e2.getMessage());
//				}
				logger.error("error in shiftChangeInsert() : "+nrE.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.updateFailed", null));
				throw new ShfException(actionErrors);		
			}finally{
//				try {
//					sql=null;
//					db.close();	// Disabled for managed breaks
//				} catch (DBException e) {
//					logger.error("error in shiftChangeInsert() while closing db connection : "+e.getMessage());
//					ActionErrors actionErrors = new ActionErrors();
//					actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
//					throw new ShfException(actionErrors);
//				}
			 }
	}	
			
	public static void changeShiftSource(DBAccess db , long agentDayId,String newSource,String originalSource) throws DBException{
		logger.debug("Starting changeShiftSource() dayId = " + agentDayId );
		String shiftSource="update shifter.shf_employee_day d set d.SOURCE=? where d.SHF_EMPLOYEE_DAY_ID=? and d.SOURCE=?";
		if(db!=null){
			db.prepareStatement(shiftSource);
			db.setString(1,newSource);
			db.setLong(2,agentDayId);
			db.setString(3,originalSource);
			try{
				db.executeUpdate();
			}catch(DBUpdateNoRowsException e){}
		}
	}
			
	public void shiftChangeUpdate(DBAccess db) throws ShfException{
		//TODO - HASAVA - shiftChangeUpdate - D
		logger.debug("Starting shiftChangeUpdate() ");
		
		int param_ind=1;
		String currentUserName = shiftForm.getUserFirstName()+" "+shiftForm.getUserLastName();
		String endChangeReason = ((ShiftDataForm)shiftForm).getNewEndStatusForUpdate();
		String startChangeReason = ((ShiftDataForm)shiftForm).getNewStartStatusForUpdate();
		long agentDayId = ((ShiftDataForm)shiftForm).getAgentDayId();
		
		Date newStartDate = null;
		Date newEndDate = null;
		Date newSplitStartDate = null;
		Date newSplitEndDate = null;
		String sNewEndDate = null;
		String sNewStartDate = null;
		boolean startDate = true;
		boolean endDate = true;
		boolean splitStartDate = false;
		boolean splitEndDate = false;
		Date firstDayDate = null;
		Date lastDayDate = null;
		
		//fix bug 367 29.01.2012
		//add dateStrEnd
		//change dateStr to dateStrStart
		String dateStrStart=BaseConvert.dateToString( ((ShiftDataForm)shiftForm).getNewStartDate(), "dd/MM/yyyy");
		String dateStrEnd=BaseConvert.dateToString( ((ShiftDataForm)shiftForm).getNewEndDate(), "dd/MM/yyyy");
		try {
			newStartDate = BaseConvert.stringToDate( sNewStartDate = (dateStrStart  + " " + ((ShiftDataForm)shiftForm).getNewStartTime()), "dd/MM/yyyy HH:mm");
			newEndDate = BaseConvert.stringToDate( sNewEndDate = (dateStrEnd + " " + ((ShiftDataForm)shiftForm).getNewEndTime()), "dd/MM/yyyy HH:mm");
			
			if (shiftForm.isShiftSplit()) {
				newSplitStartDate = BaseConvert.stringToDate( sNewStartDate = BaseConvert.dateToString(((ShiftDataForm)shiftForm).getNewStartDate(),"dd/MM/yyyy")  + " " + ((ShiftDataForm)shiftForm).getNewSplitStartTime(), "dd/MM/yyyy HH:mm");
				newSplitEndDate = BaseConvert.stringToDate( sNewEndDate  = BaseConvert.dateToString(((ShiftDataForm)shiftForm).getNewStartDate(),"dd/MM/yyyy") + " " + ((ShiftDataForm)shiftForm).getNewSplitEndTime(), "dd/MM/yyyy HH:mm");
			}
			 
			firstDayDate = bzq.shf.utils.SHFUtils.getLastNWeekDate(((ShiftDataForm)shiftForm).getShiftStart());
			lastDayDate = bzq.shf.utils.SHFUtils.getNextNWeekDate(((ShiftDataForm)shiftForm).getShiftEnd());

			firstDayDate = BaseConvert.stringToDate( BaseConvert.dateToString(firstDayDate, "dd/MM/yyyy"), "dd/MM/yyyy");
			
			String sLastDayDate =  BaseConvert.dateToString(lastDayDate, "dd/MM/yyyy") + " 23:59:00";
			lastDayDate = BaseConvert.stringToDate(sLastDayDate, "dd/MM/yyyy HH:mm");
						
		} catch (ConvertException e1) {
			//throw new ShfException("Error convert String to Date : shiftChangeInsertEnd  - " + e1);
			logger.error("error in shiftChangeUpdate() while convert String to Date : "+e1.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);			
		}
		

		CheckValidDate checkDate = new CheckValidDate(shiftForm);
		
		checkDate.setNewShiftStart(sNewStartDate);
		checkDate.setNewShiftEnd(sNewEndDate);
		checkDate.setEmpId(((ShiftDataForm)shiftForm).getEmpIdNumber());
		checkDate.setMoked(((ShiftDataForm)shiftForm).getMokedForCheck());
		
		if (newStartDate.before(firstDayDate) || newEndDate.after(lastDayDate))	{ 
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.updateFailedStartEnd", null));
			throw new ShfException(actionErrors);	
		}
		
		checkDate.checkValidDateBetweenShifts(); 
		
		startDate  = newStartDate.compareTo(((ShiftDataForm)shiftForm).getShiftStart()) == 0? false:true;
		endDate = newEndDate.compareTo(((ShiftDataForm)shiftForm).getShiftEnd()) == 0?false:true;
		if (shiftForm.isShiftSplit()) {
			splitStartDate  = newSplitStartDate.compareTo(((ShiftDataForm)shiftForm).getSplitShiftStart()) == 0? false:true;
			splitEndDate = newSplitEndDate.compareTo(((ShiftDataForm)shiftForm).getSplitShiftEnd()) == 0?false:true;
		}
		
		if ( !(endDate || startDate || splitStartDate || splitEndDate)) return;

		StringBuffer sql=new StringBuffer();
//		DBAccess db=null;	
		try{
//			db=new DBAccess(false);
			
			sql.append("UPDATE SHIFTER.SHF_DAY_CHANGES ");
			sql.append("SET MODIFICATION_TIME  = ?,MODIFICATION_USER  = ? ");						// 1, 2

			if (startDate){
				sql.append(", START_CHANGE_REASON = ?, NEW_DAY_START = ?, NEW_SHIFT_START = ? ");	// 3, 4, 5
			}
			if (endDate){
				sql.append(", END_CHANGE_REASON = ?, NEW_DAY_END = ?, NEW_SHIFT_END = ? ");			// 6, 7, 8
			}
			if (shiftForm.isShiftSplit()) {
				sql.append(", NEW_SPLIT_START = ?, NEW_SPLIT_END = ?  ");							// 9, 10
			}
			
			sql.append("WHERE SHF_EMPLOYEE_DAY_ID = ? "); 											// 11
			
			db.prepareStatement(sql.toString());
			
			db.setTimestamp(param_ind++, new Date()); 					// 1
			db.setString(param_ind++, currentUserName); 				// 2
			if (startDate){
				db.setString(param_ind++, startChangeReason);			// 3
				db.setTimestamp(param_ind++, newStartDate);				// 4
				db.setTimestamp(param_ind++, newStartDate);				// 5
			}
			if (endDate){
				db.setString(param_ind++, endChangeReason);				// 6
				db.setTimestamp(param_ind++, newEndDate);				// 7
				db.setTimestamp(param_ind++, newEndDate);				// 8
			}
			if (shiftForm.isShiftSplit()) {
				db.setTimestamp(param_ind++, newSplitStartDate);		// 9
				db.setTimestamp(param_ind++, newSplitEndDate);			// 10
			}
			
			db.setLong(param_ind++, agentDayId);						// 11
			db.executeUpdate();
			
			changeShiftSource(db,agentDayId,"SHF","WFM");
			
//			db.commit();  // Disabled for managed breaks
						 
			} catch (DBException e) {
//				try {
//					db.rollback();
//				} catch (DBException e2) {
//					logger.error("error in shiftChangeUpdate() while rollback: "+e2.getMessage());
//				}
				logger.error("error in shiftChangeUpdate() : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.updateFailed", null));
				throw new ShfException(actionErrors);
			} finally{
//				try {
//					sql=null;
//					db.close();	 // Disabled for managed breaks
//				} catch (DBException e) {
//					logger.error("error in shiftChangeUpdate() while closing db connection : "+e.getMessage());
//					ActionErrors actionErrors = new ActionErrors();
//					actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
//					throw new ShfException(actionErrors);
//				}
			}

	}	
	

	public void populateShiftForUpdate() throws ShfException {
		logger.debug("Starting populateShiftForUpdate() dayId = " + ((ShiftDataForm)shiftForm).getAgentDayId());

		int param_index=1;
		
		StringBuffer sql=new StringBuffer();
		sql.append("select d.*, ");
		
		sql.append("c.NEW_ACTIVITY, ");
		sql.append("c.NEW_DAY_END, ");
		sql.append("c.NEW_DAY_START, ");
		sql.append("c.NEW_DAY_TYPE, ");
		sql.append("c.NEW_EMPLOYEE_ID, ");
		sql.append("c.NEW_EXCEPTION_TYPE_ID, ");
		sql.append("c.NEW_PAID_MINUTES, ");
		sql.append("c.NEW_SHIFT_END, ");
		sql.append("c.NEW_SHIFT_START, ");
		sql.append("c.NEW_SITE_ID, ");
		sql.append("c.NEW_TIMEOFF_TYPE_ID, ");
		sql.append("c.NEW_WORK_MINUTES, ");
		sql.append("c.START_CHANGE_REASON, ");
		sql.append("c.END_CHANGE_REASON, ");
		sql.append("c.SWITCH_DAY_ID, ");
		sql.append("c.MODIFICATION_TIME, ");
		sql.append("c.MODIFICATION_USER, ");
		sql.append("c.NEW_WORK_FROM_HOME, ");
		sql.append("c.NEW_SPLIT_SHIFT, ");
		sql.append("c.NEW_SPLIT_START, ");
		sql.append("c.NEW_SPLIT_END, ");
		
		sql.append("a.STAGE_ARRIVAL_TIME ,  ");
		sql.append("a.STATION_ARRIVAL_TIME ,  ");
		sql.append("a.STAGE_ARRIVAL_USER , ");
		sql.append("a.STATION_ARRIVAL_USER ,  ");
		sql.append("a.LATE_MINUTES , ");
		sql.append("a.LATE_REASON_ID , ");
		sql.append("a.MISS_REASON_ID , ");
		sql.append("a.MISSING_TIME , ");
		sql.append("a.MISSING_REMARK , ");
		sql.append("a.LATE_REMARK , ");
		sql.append("a.STATION_EXIT_TIME, ");
		sql.append("a.STATION_EXIT_USER, ");
		
		sql.append("e.EMPLOYEE_ID, ");
		sql.append("e.LAST_NAME, ");
		sql.append("e.FIRST_NAME, ");
		sql.append("e.JOB_ID, ");
		sql.append("e.INNER_JOB_ID, ");
		sql.append("e.ORG_UNIT_ID, ");
		sql.append("e.emp_id_number AS EMP_ID_NUMBER_FULL ");
		
		sql.append("from SHIFTER.shf_employee_day d ");
		sql.append("left join SHIFTER.shf_day_changes c on d.shf_employee_day_id=c.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = NVL(c.NEW_EMPLOYEE_ID,d.emp_id_number) ");
		sql.append("left join SHIFTER.shf_attendance a on d.shf_employee_day_id=a.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_org_unit u on u.org_unit_id = e.org_unit_id ");
		sql.append("where e.employee_id is not null  ");
		sql.append("and d.shf_employee_day_id = ?");

		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			long sId = ((ShiftDataForm)shiftForm).getAgentDayId();
			db.setLong(param_index++, sId);
			db.executeQuery();
			if(db.next()){ 
				db.populate(shiftForm); 
			}
			
			
		} catch(DBQueryNoRowsException e){
			logger.error("error in populateShiftForUpdate() : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.populateFailed", null));
			throw new ShfException(actionErrors);
		} catch (DBException e) {
			logger.error("error in populateShiftForUpdate() : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				sql=null;
				db.close();
			} catch (DBException e) {
				logger.error("error in populateShiftForUpdate() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
		
	}
	
	
	public boolean checkIfInsert() throws ShfException {
		logger.debug("Starting checkIfInsert()" + ((ShiftDataForm)shiftForm).getAgentDayId());
		boolean retVal = false;
		int param_index=1;
		
		StringBuffer sql=new StringBuffer();
		sql.append("SELECT * ");
		sql.append("FROM SHIFTER.SHF_DAY_CHANGES ");
		sql.append("WHERE SHF_EMPLOYEE_DAY_ID = ? ");
		
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			long sId = ((ShiftDataForm)shiftForm).getAgentDayId();
			db.setLong(param_index++, sId);
			db.executeQuery();
		} catch(DBQueryNoRowsException e){
			retVal = true;
		} catch (DBException e) {
			logger.error("error in checkIfInsert() : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in checkIfInsert() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
		return retVal;
	}
	
	/**
	 * 
	 */
	public void addShift() throws ShfException {
		logger.debug("Starting addShift()");
		
		Date date=new Date();
		Date shiftStart=new Date();
		Date shiftEnd=new Date();
		shiftInforce =new ShiftInforceRequestForm();
		shiftInforce.setId(addShiftRequestForm.getInforceRequestId());
		populateInforce();
		if(shiftInforce.getAddedShiftsNum()>=shiftInforce.getOriginalNumOfAgents()){
			ActionError error=new ActionError("shf.error.changeRequestFull");
			throw new ShfException(error);
		}
		try {
			date=addShiftRequestForm.getDate();
			String dateStr=BaseConvert.dateToString(date, "dd/MM/yyyy");
			shiftStart=BaseConvert.stringToDate(dateStr + " " + addShiftRequestForm.getFrom(),"dd/MM/yyyy HH:mm");
			shiftEnd=BaseConvert.stringToDate(dateStr +" "+ addShiftRequestForm.getTo(),"dd/MM/yyyy HH:mm");
		} catch (ConvertException e) {
			logger.error("error in addShift() while convert String to Date : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}
			
		if(shiftEnd.before(shiftStart)){
			Calendar cal=Calendar.getInstance();
			cal.setTime(shiftEnd);
			cal.add(Calendar.DATE,1);
			shiftEnd=cal.getTime();
		}
		
		ShiftDataForm shiftFrm  = new ShiftDataForm();
		
		shiftFrm.setWmSiteId(SHFTableUtils.getSiteCodeOfUnit(addShiftRequestForm.getMoked()));
		shiftFrm.setNewStartDate(shiftStart);
		shiftFrm.setNewStartTime(BaseConvert.dateToString(shiftStart,"HH:mm"));
		
		shiftFrm.setNewEndDate(shiftEnd);
		shiftFrm.setNewEndTime(BaseConvert.dateToString(shiftEnd,"HH:mm"));

		if (addShiftRequestForm.getEmpIdNumber().length()>8) {
			shiftFrm.setWmEmpIdNumber(addShiftRequestForm.getEmpIdNumber().substring(0,8));
		}else{
			shiftFrm.setWmEmpIdNumber(addShiftRequestForm.getEmpIdNumber());
		}
					
		CheckValidDate validator=new CheckValidDate(shiftFrm); 
		try{
			validator.checkValidDateBetweenShiftsInforce();
		} catch(ShfException e){
			throw e;
		}
		
		long newAgentDayId=DBResource.getNextSequence("SHIFTER.SHF_AGENT_DAY_ID");
		int param=1;
		StringBuffer sqlUpd=new StringBuffer();
		sqlUpd.append("UPDATE SHIFTER.SHF_SHIFT_INFORCE_REQ SET ");
		sqlUpd.append("AGENTS_NUMBER=AGENTS_NUMBER-1 ");
		sqlUpd.append("WHERE SHIFT_INFORCE_ID=?");
						
		StringBuffer sql=new StringBuffer();
		sql.append("INSERT INTO SHIFTER.SHF_EMPLOYEE_DAY d (");
		sql.append("d.SHF_EMPLOYEE_DAY_ID,");
		sql.append("d.WM_DATE,");
		sql.append("d.WM_DAY_TYPE,");
		sql.append("d.EMP_ID_NUMBER,");
		sql.append("d.SOURCE,");
		sql.append("d.WM_SCH_ACTIVITY_ID_DATA,");
		sql.append("d.WM_START_DATETIME,");
		sql.append("d.WM_END_DATETIME,");
		sql.append("d.WM_SHIFT_START_DATETIME,");
		sql.append("d.WM_SHIFT_END_DATETIME,");
		sql.append("d.WM_SITE_ID,");
		sql.append("d.WM_WORK_MINUTES,");
		sql.append("d.WM_PAID_MINUTES) ");
		sql.append(" values (?,?,?,?,?,?,?,?,?,?,?,0,0)");

		DBAccess db=null;
		try {	
			db=new DBAccess(false);
			db.prepareStatement(sql.toString());
			db.setLong(param++,newAgentDayId);
			db.setDate(param++,date);
			db.setInt(param++,4);
			db.setString(param++,addShiftRequestForm.getEmpIdNumber().substring(0,8));
			db.setString(param++,"f"+addShiftRequestForm.getInforceRequestId());
			db.setString(param++,addShiftRequestForm.getActivity());
			db.setTimestamp(param++,shiftStart);
			db.setTimestamp(param++,shiftEnd);
			db.setTimestamp(param++,shiftStart);
			db.setTimestamp(param++,shiftEnd);
			db.setString(param++,SHFTableUtils.getSiteCodeOfUnit(addShiftRequestForm.getMoked()));
			db.executeUpdate();
			
			db.prepareStatement(sqlUpd.toString());
			db.setInt(1,addShiftRequestForm.getInforceRequestId());
			db.executeUpdate();
			
			db.commit();
			
			addBreaks(newAgentDayId);
			
		} catch (DBException e1) {
			try {
				db.rollback();
			} catch (DBException e2) {
				e2.printStackTrace();
			}
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in addShift() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		
		
	}
	

	public void setAddInforceDefaults() {
		logger.debug("Starting setAddInforceDefaults()");
		String breakString = new String();
		if(shiftInforce.getBreaksNumber()>0){
		  breakString=shiftInforce.getFirstBreakTime().substring(11, 16);
		  shiftInforce.setFirstBreakTime(breakString);
		}
		if(shiftInforce.getBreaksNumber()>1){
		  breakString=shiftInforce.getSecondBreakTime().substring(11, 16);
		  shiftInforce.setSecondBreakTime(breakString);
		}
		if(shiftInforce.getBreaksNumber()>2){
		  breakString=shiftInforce.getThirdBreakTime().substring(11, 16);
		  shiftInforce.setThirdBreakTime(breakString);
		}
						
		
		if(shiftInforce.getAllowedMoked()!=null){
			shiftInforce.setMoked(shiftInforce.getAllowedMoked());
		}
	}
	public void setAddInforceFromPotentialDefaults(PotentialInforceForm potentialInforce) {
		logger.debug("Starting setAddInforceDefaults()");
		if(shiftInforce.getAllowedMoked()!=null){
			shiftInforce.setMoked(shiftInforce.getAllowedMoked());
		}
		shiftInforce.setCategoryJob((potentialInforce.isCategoryJob()?1:0));
	}
	public void setSearchInforceOptionDefaults() {
		logger.debug("Starting setSearchInforceOptionDefaults()");
		if(potentialInforceForm.getAllowedMoked()!=null){
			potentialInforceForm .setMoked(potentialInforceForm.getAllowedMoked());
		}

		Date timeTemp = potentialInforceForm.getDate();
		Calendar cal = Calendar.getInstance();
		//cal.setTime(shiftInforce.getDate());
		cal.set(Calendar.HOUR_OF_DAY, 00);
		cal.set(Calendar.MINUTE, 00);
		cal.set(Calendar.SECOND, 00);
		timeTemp = cal.getTime();
		potentialInforceForm.setStartPotential(cal.getTime());
		cal.set(Calendar.HOUR_OF_DAY, 23);
		potentialInforceForm.setEndPotential(cal.getTime());
	}
	
	private void addBreaks(long newAgentDayId) throws ShfException{
		logger.debug("Starting addBreaks() newDayId = " + newAgentDayId);
		StringBuffer sqlBreaks=new StringBuffer();
		if(shiftInforce.getBreaksNumber()>0){
			int param=1;
			sqlBreaks.append("INSERT INTO SHIFTER.SHF_EMPLOYEE_EXCEPTIONS t ");
			sqlBreaks.append("(t.AGENT_DAY_ID,t.DURATION,t.START_TIME,t.END_TIME,t.SOURCE,t.STATE_TYPE,t.EXCEPTION_TYPE) ");
			sqlBreaks.append("values(?,?,?,?+?/1440,'SHF',?,0)");

			DBAccess db=null;
			try {
				db=new DBAccess(false);
				int length1=shiftInforce.getFirstBreakLength();
				Date firstStart=BaseConvert.stringToDate(shiftInforce.getFirstBreakTime(),"yyyy-MM-dd HH:mm:ss");
				db.prepareStatement(sqlBreaks.toString());
				db.setLong(param++,newAgentDayId);
				db.setInt(param++,length1);
				db.setTimestamp(param++,firstStart);
				db.setTimestamp(param++,firstStart);
				db.setInt(param++,length1);
				db.setInt(param++,SHFConstants.STATE_BREAK);
				db.executeUpdate();
				param=1;
				if(shiftInforce.getBreaksNumber()>1){
					db.prepareStatement(sqlBreaks.toString());
					int length2=shiftInforce.getSecondBreakLength();
					Date secondStart=BaseConvert.stringToDate(shiftInforce.getSecondBreakTime(),"yyyy-MM-dd HH:mm:ss");
					db.setLong(param++,newAgentDayId);
					db.setInt(param++,length2);
					db.setTimestamp(param++,secondStart);
					db.setTimestamp(param++,secondStart);
					db.setInt(param++,length2);
					db.setInt(param++,SHFConstants.STATE_BREAK);
					db.executeUpdate();
				}
				param=1;
				if(shiftInforce.getBreaksNumber()>2){
					db.prepareStatement(sqlBreaks.toString());
					int length3=shiftInforce.getThirdBreakLength();
					Date thirdStart=BaseConvert.stringToDate(shiftInforce.getThirdBreakTime(),"yyyy-MM-dd HH:mm:ss");
					db.setLong(param++,newAgentDayId);
					db.setInt(param++,length3);
					db.setTimestamp(param++,thirdStart);
					db.setTimestamp(param++,thirdStart);
					db.setInt(param++,length3);
					db.setInt(param++,SHFConstants.STATE_BREAK);
					db.executeUpdate();			
				}
				db.commit();	
				
				
			}catch(ConvertException e){ 
				logger.error("error in addBreaks() while convert from string to date: "+e.getMessage());
				logger.debug("start rollback");
				try {
					db.rollback();
				} catch (DBException e1) {
					logger.error("error in addBreaks() while rollbacking after ConvertException : "+e.getMessage());
					ActionErrors actionErrors = new ActionErrors();
					actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general"));
					throw new ShfException(actionErrors);
				}
			}catch (DBException e) {
				logger.error("error in addBreaks() while convert from string to date: "+e.getMessage());
				logger.debug("start rollback");
				try {
					db.rollback();
				} catch (DBException e1) {
					logger.error("error in addBreaks() while rollbacking after DBException : "+e.getMessage());
					ActionErrors actionErrors = new ActionErrors();
					actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general"));
					throw new ShfException(actionErrors);
				}
			}finally{
				try {
					db.close();
				} catch (DBException e) {
					logger.error("error in addBreaks() while closing db connection : "+e.getMessage());
					ActionErrors actionErrors = new ActionErrors();
					actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general"));
					throw new ShfException(actionErrors);
				}
			}	
		
		}
	}
	

	public void fixBreaks(DBAccess db, Vector<BreakBean> newBreaks) throws ShfException{
		logger.debug("Starting fixBreaks() dayId = " + shiftForm.getAgentDayId());
		logger.info("Starting fixBreaks() dayId = " + shiftForm.getAgentDayId()+", empId = "+shiftForm.getEmpIdNumber());
		try {	// in case used values are NULLs
			logger.info("continuing fixBreaks() dayId = " + shiftForm.getAgentDayId()+", NewStartDate ="+shiftForm.getNewStartDate()+", NewStartTime = "+shiftForm.getNewStartTime());
			logger.info("continuing fixBreaks() dayId = " + shiftForm.getAgentDayId()+", NewEndDate ="+shiftForm.getNewEndDate()+", NewEndTime = "+shiftForm.getNewEndTime());
			logger.info("continuing fixBreaks() shiftForm.getShiftStart() = " + shiftForm.getShiftStart());
			logger.info("continuing fixBreaks() shiftForm.getShiftEnd() = " + shiftForm.getShiftEnd());
		} catch (Exception e) {
			logger.error("Error in fixBreaks() : "+e.getMessage(), e);
			e.printStackTrace();
		}
		try{
			Date newStart = BaseConvert.stringToDate(BaseConvert.dateToString(shiftForm.getNewStartDate(),"dd/MM/yyyy")+" "+shiftForm.getNewStartTime(),"dd/MM/yyyy HH:mm");
			Date newEnd = BaseConvert.stringToDate(BaseConvert.dateToString(shiftForm.getNewEndDate(),"dd/MM/yyyy")+" "+shiftForm.getNewEndTime(),"dd/MM/yyyy HH:mm");
			try {
				logger.info("After Convert newStart = "+newStart);
				logger.info("After Convert newEnd = "+newEnd);
			} catch (Exception e) {
				logger.error("Error in fixBreaks() : "+e.getMessage(), e);
				e.printStackTrace();
			}
			int newLength = SHFUtils.getMinutesBetween(newStart,newEnd);
			int prevLength = SHFUtils.getMinutesBetween(shiftForm.getShiftStart(),shiftForm.getShiftEnd());
			
			if(newLength == prevLength){
				BreakBean breakInfo = new BreakBean();
				breakInfo.setAgentDayId(shiftForm.getAgentDayId());
				int difference = SHFUtils.getMinutesBetween(shiftForm.getShiftStart(),newStart);
				if(newStart.before(shiftForm.getShiftStart())){
					difference*=-1;
				}
				BreakDataModel.moveBreaks(breakInfo,difference, db);
				
				if (newBreaks != null && newBreaks.size() > 0) {
					for (BreakBean breakBean : newBreaks) {
						Calendar calStart = Calendar.getInstance();
						calStart.setTime(breakBean.getStartTime());
						calStart.add(Calendar.MINUTE, difference);
						breakBean.setStartTime(calStart.getTime());
						
						Calendar calEnd = Calendar.getInstance();
						calEnd.setTime(breakBean.getEndTime());
						calEnd.add(Calendar.MINUTE, difference);
						breakBean.setEndTime(calEnd.getTime());
					}
				}

			}
			else{
				shiftForm.setNewShiftStart(newStart);
				shiftForm.setNewShiftEnd(newEnd);
				BreakDataModel.deleteInvalidBreaks((AgentDayBean)shiftForm, db);
				
				Vector<BreakBean> newBreaksTmp = new Vector<BreakBean>();
				
				if (newBreaks != null && newBreaks.size() > 0) {
					
					for (BreakBean breakBean : newBreaks) {
						Calendar calStart = Calendar.getInstance();
						calStart.setTime(((AgentDayBean)shiftForm).getShiftStart());
						calStart.add(Calendar.HOUR, 1);
						
						Calendar calEnd = Calendar.getInstance();
						calEnd.setTime(((AgentDayBean)shiftForm).getShiftEnd());
						calEnd.add(Calendar.HOUR, -1);
						
						if ( ! ( breakBean.getStartTime().before(calStart.getTime()) ||  breakBean.getEndTime().after(calEnd.getTime())) ) {
							newBreaksTmp.add(breakBean);
						}
					}
					
					newBreaks.clear();
					
					for (BreakBean breakBean : newBreaksTmp) {
						newBreaks.add(breakBean);
					}
					
				}
			}
		}catch(ConvertException e){
			logger.error("Error in fixBreaks() while converting : "+e.getMessage(), e);
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general",null));
			throw new ShfException(actionErrors);
		}
	}
	/**
	 * 
	 */
	public void validateUpdate()throws ShfException {
		logger.debug("Starting validateUpdate() dayId = " + shiftForm.getAgentDayId());
		Date newStart = null;
		Date newEnd = null;
		populateShiftForUpdate();
		
		//check legal dates format
		try {
			newStart = BaseConvert.stringToDate(BaseConvert.dateToString(shiftForm.getNewStartDate(),"dd/MM/yyyy")+" "+shiftForm.getNewStartTime(),"dd/MM/yyyy HH:mm");
			newEnd = BaseConvert.stringToDate(BaseConvert.dateToString(shiftForm.getNewEndDate(),"dd/MM/yyyy")+" "+shiftForm.getNewEndTime(),"dd/MM/yyyy HH:mm");
		} catch (ConvertException e) {
			logger.error("error in validateUpdate() while convert from string to date: "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general",null));
			throw new ShfException(actionErrors);
		}
		
		// check if attendance made
		if( //shiftForm.getStageArrivalTime()!=null || 
			//shiftForm.getStationArrivalTime()!=null || 
			//shiftForm.getStationExitTime() !=null ||
			shiftForm.getMissingReasonId()>0){
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.unableToMoveShift", null));
				throw new ShfException(actionErrors);
		}
		
		// check if shift is forced shift	
		/*if(shiftForm.getShiftSource().startsWith("f")){
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.updateFailedShiftSource",null));
			throw new ShfException(actionErrors);
		}*/
		
		Date firstDayDate = bzq.shf.utils.SHFUtils.getLastNWeekDate(shiftForm.getShiftStart());
		Date lastDayDate = bzq.shf.utils.SHFUtils.getNextNWeekDate(shiftForm.getShiftEnd());
		
		if (newStart.before(firstDayDate) || newEnd.after(lastDayDate) ) { 
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.updateFailedStartEnd", null));					
			throw new ShfException(actionErrors);
		}
					
		String len=SHFParameters.getMinimalShiftDuration(shiftForm.getAllowedMoked()).getValue();
		int minlen=0;
		if(len!=null) minlen=Integer.parseInt(len); 
		if(SHFUtils.getMinutesBetween(newStart,newEnd)<minlen){
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.lowShiftDuration",null));
			throw new ShfException(actionErrors);
		}
		if(newEnd.before(newStart)){
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.updateFailedEndBeforeStart",null));
			throw new ShfException(actionErrors);
		}
		/*if(newStart.before(new Date())){
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.updateFailedStartBeforeCurrent",null));
			throw new ShfException(actionErrors);
		}*/
		try{
			checkIfSwitchBreakMade(shiftForm.getAgentDayId());
		}catch (ShfSwitchBreakExistsException e) {
			if(shiftForm.isCancelBreakSwitch()){
				BreakDataModel breakDataModel=new BreakDataModel();
				breakDataModel.deleteAllBreaksFromCandidate(shiftForm.getAgentDayId());
			}else{
				throw e;
			}
			
		}
		checkIfSwitchShiftMade(shiftForm.getAgentDayId());
		
		// if split shift, validate split
		if(shiftForm.isShiftSplit()){
			Date newSplitStart = null;
			Date newSplitEnd = null;
			
			try {
				newSplitStart = BaseConvert.stringToDate(BaseConvert.dateToString(shiftForm.getNewStartDate(),"dd/MM/yyyy")+" "+shiftForm.getNewSplitStartTime(),"dd/MM/yyyy HH:mm");
				newSplitEnd = BaseConvert.stringToDate(BaseConvert.dateToString(shiftForm.getNewStartDate(),"dd/MM/yyyy")+" "+shiftForm.getNewSplitEndTime(),"dd/MM/yyyy HH:mm");
			} catch (ConvertException e) {
				logger.error("error in validateUpdate() while convert from string to date: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general",null));
				throw new ShfException(actionErrors);
			}
			
			AgentDayBean newDay = new AgentDayBean();
			newDay.setNewShiftStart(newStart);
			newDay.setNewShiftEnd(newEnd);
			newDay.setNewSplitShift("Y");
			newDay.setNewSplitStart(newSplitStart);
			newDay.setNewSplitEnd(newSplitEnd);
			
			validateSplitShift(newDay);
		}
	}
	
	public void cancelShift() throws ShfException{
		//TODO - HASAVA - cancelShift - no need to change
		logger.debug("Starting cancelShift() dayId = " + shiftForm.getAgentDayId());
		
		// 9.2016 Managed breaks, send deleted breaks to SoftPhone, if failed revert cancel shift
		EmployeeDataForm empForm = new EmployeeDataForm();
		empForm.setEmployeeId(shiftForm.getEmployeeId());
		EmployeeDataModel empModel = new EmployeeDataModel(empForm);
		empModel.populate();
		
		boolean isManagedBreaks = Boolean.parseBoolean(bzq.shf.utils.SHFParameters.getManagedBreakEnabled(SHFTableUtils.getMokedCodeOf(empForm.getOrgUnitId())).getValue());
//		boolean isPilotAgent = SHFConstants.managedBreaksEmpList.contains(empForm.getIdNumber().substring(0, empForm.getIdNumber().length()-1));
		
		Vector<BreakBean> oldBreaksForManaged = null;
		BreakDataModel breakModel = new BreakDataModel();
		
		if (isManagedBreaks /*&& isPilotAgent*/) {
			// Get current data for breaks
			oldBreaksForManaged = breakModel.populateBreaksForShift(shiftForm.getAgentDayId());
		}
		
		int param=1;
		DBAccess db=null;
		
		try {
			db=new DBAccess(false);
			changeShiftSource(db,shiftForm.getAgentDayId(),"SHF","WFM");
			
			try{
				StringBuffer sql1 = new StringBuffer();
				sql1.append("UPDATE SHIFTER.SHF_DAY_CHANGES SET " );
				sql1.append("NEW_DAY_TYPE=?,MODIFICATION_TIME=?,MODIFICATION_USER=?,"); //1, 2, 3
				sql1.append("NEW_EMPLOYEE_ID = ?,CANCEL_REASON_CODE=?,CANCEL_REASON_REMARK=? WHERE SHF_EMPLOYEE_DAY_ID=? " ); // 4
			
				db.prepareStatement(sql1.toString());
				db.setInt(param++,SHFConstants.DAY_TYPE_DAYOFF); //1
				db.setTimestamp(param++,new Date()); //2
				db.setString(param++,shiftForm.getUserFirstName()+" "+shiftForm.getUserLastName()); //3
				db.setLong(param++, SHFConstants.DAY_CANCEL_ID); //4
				db.setString(param++, shiftForm.getCancelReasonCode()); //5
				db.setString(param++, shiftForm.getCancelReasonRemark()); //6
				db.setLong(param++,shiftForm.getAgentDayId()); //7
				db.executeUpdate();
			} catch (DBUpdateNoRowsException e){
			
					try {
				
						param = 1;
						StringBuffer sql = new StringBuffer();
						sql.append("INSERT INTO SHIFTER.SHF_DAY_CHANGES " );
						sql.append("(SHF_EMPLOYEE_DAY_ID,NEW_DAY_TYPE,NEW_DAY_START," );
						sql.append("NEW_DAY_END,NEW_SHIFT_START,NEW_SHIFT_END," );
						sql.append("MODIFICATION_TIME,MODIFICATION_USER, " ); 
						sql.append("NEW_EMPLOYEE_ID,CANCEL_REASON_CODE,CANCEL_REASON_REMARK ) VALUES(?,?,?,?,?,?,?,?,?,?,?) " );
										
						db.prepareStatement(sql.toString());
						db.setLong(param++,shiftForm.getAgentDayId());
						db.setInt(param++,SHFConstants.DAY_TYPE_DAYOFF);
						db.setTimestamp(param++,null);
						db.setTimestamp(param++,null);
						db.setTimestamp(param++,null);
						db.setTimestamp(param++,null);
						db.setTimestamp(param++,new Date()); 
						db.setString(param++,shiftForm.getUserFirstName()+" "+shiftForm.getUserLastName());
						db.setLong(param++, SHFConstants.DAY_CANCEL_ID);
						db.setString(param++, shiftForm.getCancelReasonCode());
						db.setString(param++, shiftForm.getCancelReasonRemark());
						db.executeUpdate();
					} catch (DBException ee) {
						logger.debug("starting rollback in cancelShift() ");
						db.rollback();
						ActionErrors actionErrors = new ActionErrors();
						actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.updateFailed", null));
						throw new ShfException(actionErrors); 
					}
				}
				
			try {	
				EmployeeExceptionForm exceptionForm=new EmployeeExceptionForm();
				exceptionForm.setAgentDayId(shiftForm.getAgentDayId());
				exceptionForm.setUserFirstName(shiftForm.getUserFirstName());
				exceptionForm.setUserLastName(shiftForm.getUserLastName());
				exceptionForm.setCancelReasonCode(shiftForm.getCancelReasonCode());
				exceptionForm.setCancelRemark(shiftForm.getCancelReasonRemark());
				ExceptionDataModel exception=new ExceptionDataModel(exceptionForm);
				exception.cancelDayParts(db);
				logger.info("parts of shift "+shiftForm.getAgentDayId()+" were successfully cancelled.");
			}catch (DBUpdateNoRowsException e) {
				logger.info("no parts of shift "+shiftForm.getAgentDayId()+" were found.");
			}catch(DBException e){
				logger.error("could not cancel parts of shift: "+shiftForm.getAgentDayId()+": "+e.getMessage());
				db.rollback();
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.updateFailed", null));
				throw new ShfException(actionErrors); 
			}	 
//			db.commit();	// Managed breaks, commit only if breaks were successfully synchronized with SoftPhone
			
		} catch (DBException e) {
			logger.error("error in cancelShift() : "+ e.getMessage());
			logger.debug("starting rollback ");
			try {
				db.rollback();
			} catch (DBException e1) {
				logger.error("error while db.rollback() in cancelShift() : "+ e1.getMessage());
			}
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
//			try {
//				db.close();
//			} catch (DBException e) {
//				logger.error("error in cancelShift() while closing db connection: "+e.getMessage());
//				ActionErrors actionErrors=new ActionErrors();
//				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
//				throw new ShfException(actionErrors);
//			}
		}
		
		
		// 9.2016 Managed breaks, send deleted breaks to SoftPhone, if failed revert cancel shift
		
		if (isManagedBreaks /*&& isPilotAgent*/) {
			logger.info("Managed breaks : isManagedBreaks ...");
			bzq.shfsp.request.ObjectFactory of = new bzq.shfsp.request.ObjectFactory();
			SHFSPBreaks breakObject = of.createSHFSPBreaks();
			List<BreakInfo> breakInfoList = breakObject.getBreakInfo();
			
			breakObject.setActionId(SHFConstants.SHF_SP_ACTION_ID_BREAK_UPDATE);
			SHFUtils.setSHFSPMessageDefaults(breakObject);
			breakObject.setUserId(shiftForm.getUserId());

			if (oldBreaksForManaged.size() > 0) {
				for (BreakBean breakBean : oldBreaksForManaged) {
					BreakInfo breakInfoIns = of.createSHFSPBreaksBreakInfo();
					breakInfoIns.setMode("D");	// delete
					breakInfoIns.setEmployeeId(empForm.getIdNumber());
					breakInfoIns.setAgentDayId(shiftForm.getAgentDayId());
					breakInfoIns.setStartDatePlanned(BaseConvert.dateToString(breakBean.getStartTime(), "yyyyMMddHHmmss"));
					breakInfoIns.setDuration(breakBean.getDuration());
					
					breakInfoList.add(breakInfoIns);
				}
			}
			
			if (breakObject.getBreakInfo().size() > 0) {	// changes exist -> send message to SoftPhone
				
				// convert to xml string (initial)
				String xmlStringMsg = null;
				try {
					xmlStringMsg = SHFUtils.objToXmlString(breakObject, SHFConstants.SHF_SP_JAXB_REQUEST_CONTEXT);
				} catch (JAXBException e) {
					logger.error("Error while creating XML string for sending message : " + e.getMessage());
				}
				
				// insert to transactions table and get transaction ID
				TransactionBean transBean = breakModel.getTransBeanBase(SHFConstants.SHF_SP_PROCESS_ID_ADD_SHIFT, SHFConstants.SHF_SP_SOURCE, SHFConstants.SHF_SP_DESTINATION, shiftForm.getUserId(), xmlStringMsg);
				
				breakModel.createMessageTransaction(transBean);
				
				breakObject.setTransactionId(String.valueOf(transBean.getId()));
				
				// convert to xml string (final)
				try {
					xmlStringMsg = SHFUtils.objToXmlString(breakObject, SHFConstants.SHF_SP_JAXB_REQUEST_CONTEXT);
					logger.info("xmlString : "+xmlStringMsg);
				} catch (JAXBException e) {
					logger.error("Error while creating XML string for sending message : " + e.getMessage());
				}
				
				// send Tibco message
				if (xmlStringMsg != null && transBean.getId() != 0) {
					
					try {
						logger.info("Attempting to send message to tibco queue ...");
						breakModel.sendTibcoQueueMsg(SHFConstants.SHF_SP_ATTRIBUTE_VALUE, sCtx, xmlStringMsg);
					} catch (XPathExpressionException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					} catch (IllegalArgumentException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					} catch (NamingException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					} catch (JMSException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					}
					
					//check for reply: either no reply, reply with error or success. If no reply or no success then revert changes at shifter side.
					logger.info("Checking response for transactiod id : " + transBean.getId());
					
					Vector<Long> tmpVec = new Vector<Long>();
					tmpVec.add(transBean.getId());
					Vector<TransactionBean> response = null;
					boolean success = false;
					
					try {
						response = breakModel.checkMessageResponse(tmpVec);
						
						if(response.size() > 0) {
							TransactionBean respBean = response.get(0);
							if(respBean.getXmlResponse() != null && SHFConstants.SHF_SP_RESPONSE_SUCCESS_CODE == respBean.getStatus() && respBean.getStatusDescription() == null){
								success = true;
							}
						}
						
					} catch (Exception e) {
						
					}
					if ( ! success) {	// Failed to update SoftPhone, revert changes
						logger.info("Sync with SoftPhone failed, attempting to revert changes ... ");
						
						try {
							logger.info("Attempting DB rollback ... ");
							db.rollback();
						} catch (DBException e) {
							logger.error("Error while rollback : " + e.getMessage());
							ActionErrors actionErrors = new ActionErrors();
							actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
							throw new ShfException(actionErrors);
						} finally {
							try {
								db.close();
							} catch (DBException e) {
								logger.error("error while closing db connection: "+e.getMessage());
								ActionErrors actionErrors = new ActionErrors();
								actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
								throw new ShfException(actionErrors);
							}
						}
						logger.info("Changes reverted successfully !");
						ActionErrors actionErrors = new ActionErrors();
						actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.shfsp_sync_failed"));
						throw new ShfException(actionErrors);

					} else {
						logger.info("Sync with SoftPhone complete, all changes applied successfully");
					}
				}
			}
		}	// END IF isManagedBreaks
		
		try {
			db.commit();
		} catch (DBException e) {
			logger.error("Error while commit : " + e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally {
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error while closing db connection: "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		
	}
	
	public void upsertShift () throws ShfException {
		logger.debug("Starting upsertShift(), day id : " + shiftForm.getAgentDayId());
		
		// auto breaks, retrieve current shift and breaks (before possible change)
		boolean isManagedBreaks = Boolean.parseBoolean(bzq.shf.utils.SHFParameters.getManagedBreakEnabled(SHFTableUtils.getMokedCodeOf(shiftForm.getOrgUnitCode())).getValue());
//		boolean isPilotAgent = SHFConstants.managedBreaksEmpList.contains(shiftForm.getEmpIdNumber());
		Vector<BreakBean> oldBreaks = null;	// break data for sending message
		Vector<BreakBean> newBreaks = new Vector<BreakBean>();	// break data for sending message (after possible changes during shift change)

		if (isManagedBreaks /*&& isPilotAgent*/) {
			try {
				oldBreaks = BreakDataModel.populateBreaksForShift(shiftForm.getAgentDayId());
				if (oldBreaks.size() > 0) {
					for (BreakBean oldBreakBean : oldBreaks) {
						BreakBean tmpBean = new BreakBean();
						tmpBean.setAgentDayId(oldBreakBean.getAgentDayId());
						tmpBean.setDuration(oldBreakBean.getDuration());
						tmpBean.setEmployeeId(oldBreakBean.getEmployeeId());
						tmpBean.setEndTime(oldBreakBean.getEndTime());
						tmpBean.setOrgUnitId(oldBreakBean.getOrgUnitId());
						tmpBean.setStartTime(oldBreakBean.getStartTime());
						
						newBreaks.add(tmpBean);
					}
				}
			} catch (ShfException e) {
				logger.error("Error while populating old data for managed breaks");
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		
		DBAccess db = new DBAccess(false);	// start transaction
		
		try {
			if (checkIfInsert()) {
				shiftChangeInsert(db);
			} else {
				shiftChangeUpdate(db);
			}
			
			fixBreaks(db, newBreaks);
		} catch (ShfException e) {
			logger.error("Error upsert shift");
			
			try {
				logger.error("Attempting to rollback ... ");
				db.rollback();
			}catch (DBException e2) {
				logger.error("Error while rollback ...", e2);
			} finally {
			
				try {
					db.close();
				} catch (Exception e2) {
					logger.error("Error while closing connection...", e2);
				}
			}
			
			throw e;
		}
		
		// Managed breaks, send message to SoftPhone 8.2016

		if (isManagedBreaks /*&& isPilotAgent*/) {
			
			bzq.shfsp.request.ObjectFactory of = new bzq.shfsp.request.ObjectFactory();
			SHFSPBreaks breakObject = of.createSHFSPBreaks();
			List<BreakInfo> breakInfoList = breakObject.getBreakInfo();
			
			breakObject.setActionId(SHFConstants.SHF_SP_ACTION_ID_BREAK_UPDATE);
			SHFUtils.setSHFSPMessageDefaults(breakObject);
			breakObject.setUserId(shiftForm.getUserId());
			
			if (oldBreaks != null && oldBreaks.size() > 0 ) {	// if agent has old breaks
				
				if (oldBreaks.size() == newBreaks.size()) {	// either no change or all breaks shifted same amount of time (start+end)
					
					// check if shifted time (otherwise if no changes made nothing to do)
						
					boolean isTimeShift = true; // assume by default
					
					for (BreakBean oldBreakBean : oldBreaks) {	// determine if no change or time shift (no change : old time = new time, time shift :  old time != new time)
						for (BreakBean newBreakBean : newBreaks) {
							if(oldBreakBean.getStartTime().compareTo(newBreakBean.getStartTime()) == 0 ) {
								isTimeShift = false;
								break;
							}
						}
						break;	// enough to run once
					}
					
					if (isTimeShift) {	// if time shift occurred for all breaks, then need to update SoftPhone to delete old breaks and insert new ones
						
						for (BreakBean oldBreakBean : oldBreaks) {	// prepare breaks for delete
							BreakInfo breakInfoDel = of.createSHFSPBreaksBreakInfo();
							breakInfoDel.setMode("D");
							breakInfoDel.setEmployeeId(shiftForm.getEmployeeIdNumberFull());
							breakInfoDel.setAgentDayId(shiftForm.getAgentDayId());
							breakInfoDel.setStartDatePlanned(BaseConvert.dateToString(oldBreakBean.getStartTime(), "yyyyMMddHHmmss"));
							breakInfoDel.setDuration(oldBreakBean.getDuration());
							
							breakInfoList.add(breakInfoDel);
						}
						
						for (BreakBean newBreakBean : newBreaks) {	// prepare breaks for insert
							BreakInfo breakInfoIns = of.createSHFSPBreaksBreakInfo();
							breakInfoIns.setMode("I");
							breakInfoIns.setEmployeeId(shiftForm.getEmployeeIdNumberFull());
							breakInfoIns.setAgentDayId(shiftForm.getAgentDayId());
							breakInfoIns.setStartDatePlanned(BaseConvert.dateToString(newBreakBean.getStartTime(), "yyyyMMddHHmmss"));
							breakInfoIns.setDuration(newBreakBean.getDuration());
							
							breakInfoList.add(breakInfoIns);
						}
						
					}
				} else {	// some / all breaks were deleted
					
					Vector<BreakBean> breaksForDel = new Vector<BreakBean>();
					
					for (BreakBean oldBreakBean : oldBreaks) {	// scan for deleted breaks
						boolean found = false;
						
						for (BreakBean newBreakBean : newBreaks) {
							if(oldBreakBean.getStartTime().compareTo(newBreakBean.getStartTime()) == 0 ) {
								found = true;
								break;
							}
						}
						
						if ( ! found) {	// if old break was not found in new ones => deleted
							breaksForDel.add(oldBreakBean);
						}
					}
					
					if (breaksForDel.size() > 0) {
						for (BreakBean breakBean : breaksForDel) {
							BreakInfo breakInfoDel = of.createSHFSPBreaksBreakInfo();
							breakInfoDel.setMode("D");
							breakInfoDel.setEmployeeId(shiftForm.getEmployeeIdNumberFull());
							breakInfoDel.setAgentDayId(shiftForm.getAgentDayId());
							breakInfoDel.setStartDatePlanned(BaseConvert.dateToString(breakBean.getStartTime(), "yyyyMMddHHmmss"));
							breakInfoDel.setDuration(breakBean.getDuration());
							
							breakInfoList.add(breakInfoDel);
						}
						
					}
			
				}
					
				if (breakObject.getBreakInfo().size() > 0) {	// changes exist -> send message to SoftPhone
					BreakDataModel breakModel = new BreakDataModel();
					
					// convert to xml string
					String xmlStringMsg = null;
					try {
						xmlStringMsg = SHFUtils.objToXmlString(breakObject, SHFConstants.SHF_SP_JAXB_REQUEST_CONTEXT);
					} catch (JAXBException e) {
						logger.error("Error while creating XML string for sending message : " + e.getMessage());
					}
					
					// insert to transactions table and get transaction ID
					TransactionBean transBean = breakModel.getTransBeanBase(SHFConstants.SHF_SP_PROCESS_ID_SHIFT_UPDATE, SHFConstants.SHF_SP_SOURCE, SHFConstants.SHF_SP_DESTINATION, shiftForm.getUserId(), xmlStringMsg);
					
					breakModel.createMessageTransaction(transBean);
					
					breakObject.setTransactionId(String.valueOf(transBean.getId()));
					
					try {
						xmlStringMsg = SHFUtils.objToXmlString(breakObject, SHFConstants.SHF_SP_JAXB_REQUEST_CONTEXT);
						logger.info("xmlString : "+xmlStringMsg);
					} catch (JAXBException e) {
						logger.error("Error while creating XML string for sending message : " + e.getMessage());
					}
					
					if (xmlStringMsg != null && transBean.getId() != 0) {
						
						try {
							logger.info("Attempting to send message to tibco queue ...");
							breakModel.sendTibcoQueueMsg(SHFConstants.SHF_SP_ATTRIBUTE_VALUE, sCtx, xmlStringMsg);
						} catch (XPathExpressionException e) {
							// TODO Auto-generated catch block
							e.printStackTrace();
						} catch (IllegalArgumentException e) {
							// TODO Auto-generated catch block
							e.printStackTrace();
						} catch (NamingException e) {
							// TODO Auto-generated catch block
							e.printStackTrace();
						} catch (JMSException e) {
							// TODO Auto-generated catch block
							e.printStackTrace();
						}
							
						// check for reply: either no reply, reply with error or success. If no reply or no success then revert changes at shifter side.
						logger.info("Checking response for transactiod id : " + transBean.getId());
						
						Vector<Long> tmpVec = new Vector<Long>();
						tmpVec.add(transBean.getId());
						Vector<TransactionBean> response = null;
						boolean success = false;
						
						try {
							response = breakModel.checkMessageResponse(tmpVec);
							
							if(response.size() > 0) {
								TransactionBean respBean = response.get(0);
								if(respBean.getXmlResponse() != null && SHFConstants.SHF_SP_RESPONSE_SUCCESS_CODE == respBean.getStatus() && respBean.getStatusDescription() == null){
									success = true;
								}
							}
							
						} catch (Exception e) {
							
						}
						
						if ( ! success) {
							logger.info("Sync with SoftPhone failed, attempting to revert changes ... ");
							
							try {
								logger.info("Attempting DB rollback ... ");
								db.rollback();
							} catch (DBException e) {
								logger.error("Error while rollback : " + e.getMessage());
								ActionErrors actionErrors = new ActionErrors();
								actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
								throw new ShfException(actionErrors);
							} finally {
								try {
									db.close();
								} catch (DBException e) {
									logger.error("error while closing db connection: "+e.getMessage());
									ActionErrors actionErrors = new ActionErrors();
									actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
									throw new ShfException(actionErrors);
								}
							}
							logger.info("Changes reverted successfully !");
							ActionErrors actionErrors = new ActionErrors();
							actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.shfsp_sync_failed"));
							throw new ShfException(actionErrors);
							
						} else {
							logger.info("Sync with SoftPhone complete, all changes applied successfully");
						}
					}
				}
				
			} // END IF (oldBreaks != null && oldBreaks.size() > 0 )
		} // END IF isManagedBreaks
		
		try {
			db.commit();
		} catch (DBException e) {
			logger.error("Error while commit : " + e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally {
			try {
				db.close();
			} catch (DBException e) {
				logger.error("Error while closing db connection: "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		
	} // END METHOD
	
	public void updateShiftLocation() throws ShfException{
		
		DBAccess db = null;
		AgentDayBean dayBean = populateShift(shiftForm.getAgentDayId());
		
		if (dayBean.getShiftExtNum() != null) {
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.updateFailedPoolExt"));
			throw new ShfException(actionErrors);
		}
		
		try {
			db = new DBAccess(false);
			
			if(checkIfInsert()) {	// no changes, create new record in DAY_CHANGES table with current shift data and new shiftLocation
				
				
				shiftForm.setNewStartDate(dayBean.getShiftStart());
				shiftForm.setNewStartTime(BaseConvert.dateToString(dayBean.getShiftStart(), "HH:mm"));
				shiftForm.setNewEndDate(dayBean.getShiftEnd());
				shiftForm.setNewEndTime(BaseConvert.dateToString(dayBean.getShiftEnd(), "HH:mm"));
				shiftForm.setWmEmpIdNumber(dayBean.getEmpIdNumber());
				shiftForm.setWmShiftStartTime(dayBean.getShiftStart());
				shiftForm.setWmShiftEndTime(dayBean.getShiftEnd());
				shiftForm.setWmSiteId(dayBean.getSiteId());
				
				if (dayBean.isShiftSplit()) {
					shiftForm.setNewSplitShift(dayBean.getSplitShift());
					shiftForm.setNewSplitStart(dayBean.getSplitStart());
					shiftForm.setNewSplitStartTime(BaseConvert.dateToString(dayBean.getSplitStart(), "HH:mm"));
					shiftForm.setNewSplitEnd(dayBean.getSplitEnd());					
					shiftForm.setNewSplitEndTime(BaseConvert.dateToString(dayBean.getSplitEnd(), "HH:mm"));					
				}	
				
				shiftChangeInsert(db);
				
			} else {	// update DAY_CHANGES table
				StringBuffer sql = new StringBuffer();
				
				sql.append("UPDATE SHIFTER.SHF_DAY_CHANGES ");
				sql.append("SET MODIFICATION_TIME = ?, MODIFICATION_USER = ?, NEW_WORK_FROM_HOME = ?");
				sql.append("WHERE SHF_EMPLOYEE_DAY_ID = ?");
				
				db.prepareStatement(sql.toString());
				
				int ind = 1;				
				db.setTimestamp(ind++, new Date());
				db.setString(ind++, shiftForm.getUserFirstName()+" "+shiftForm.getUserLastName());
				db.setString(ind++, "site".equals(shiftForm.getShiftLocation()) ? "N" : "Y");
				db.setLong(ind++, shiftForm.getAgentDayId());
				
				db.executeUpdate();
			}
			
			db.commit();
		} catch (DBException e) {
			logger.error("DB Error : ", e);
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally {
			try {
				db.close();
			} catch (DBException e) {
				logger.error("Error while closing db connection: "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}		
	}
	
	public void checkShiftForCancel() throws ShfException{
		logger.debug("Starting checkShiftForCancel() dayId = " + shiftForm.getAgentDayId());
		checkIfEntryMade(shiftForm.getAgentDayId());
		checkIfSwitchShiftMade(shiftForm.getAgentDayId());
		checkIfSwitchBreakMade(shiftForm.getAgentDayId());
		
		AgentDayBean agentDayBean = populateShift(shiftForm.getAgentDayId());
		
		if (agentDayBean.getShiftExtNum() != null) {
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.cancelFailedPoolExt", null));					
			throw new ShfException(actionErrors);
		}
	}
	
	public static void checkIfEntryMade(long dayId) throws ShfException{
		logger.debug("Starting checkIfEntryMade() dayId = " + dayId);	
		String sSql = "SELECT * FROM SHIFTER.SHF_ATTENDANCE " +  
		"WHERE ( (STAGE_ARRIVAL_TIME IS NOT NULL ) OR (STATION_ARRIVAL_TIME IS NOT NULL) OR (MISS_REASON_ID > 0)) " +
		"AND SHF_EMPLOYEE_DAY_ID = ? ";
		
		DBAccess db =null;	
		try {
			db = new DBAccess();
			db.prepareStatement(sSql);
			db.setLong(1, dayId);
			db.executeQuery();
			
			if (db.next()) {
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.entryExist", null));					
				throw new ShfException(actionErrors);				
			}
			
		} catch(DBQueryNoRowsException e){

		} catch (DBException e) {
			logger.error("error in checkIfEntryMade() : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in checkIfEntryMade() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}

	}
	
	public Vector<AgentDayBean> getShiftsWithEntryToday () throws ShfException {
		logger.debug("Starting getShiftsWithEntryToday()");
		
		Vector<AgentDayBean> shifts = null;
		
		StringBuffer sql = new StringBuffer();
		
		sql.append("SELECT c.*, d.* ");
		sql.append("FROM shifter.shf_employee_day d ");
		sql.append("LEFT JOIN shifter.shf_day_changes c ON c.shf_employee_day_id = d.shf_employee_day_id ");  
		sql.append("LEFT JOIN shifter.shf_attendance a ON a.shf_employee_day_id = NVL(c.shf_employee_day_id, d.shf_employee_day_id) ");  
		sql.append("WHERE TRUNC(NVL(c.new_shift_start, d.wm_date)) = TRUNC(?) ");	// 1
		sql.append("AND (a.stage_arrival_time IS NOT NULL OR a.station_arrival_time IS NOT NULL) ");  
		sql.append("AND NVL(c.new_day_type, d.wm_day_type) = 4 ");
		
		DBAccess db = null;	
		try {
			db = new DBAccess();
			db.prepareStatement(sql.toString());
			db.setTimestamp(1, new Date());	// 1
			db.executeQuery();
			shifts = new Vector<AgentDayBean>();
			db.populate("bzq.shf.bean.AgentDayBean",shifts);
			
		} catch(DBQueryNoRowsException e){

		} catch (DBException e) {
			logger.error("DB error in getShiftsWithEntryToday()",e);
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("Error while closing db connection : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
		
		return shifts;
		
	}

	public static void checkIfSwitchShiftMade(long agendDay) throws ShfException{
		logger.debug("Starting checkIfSwitchShiftMade() dayId = " + agendDay);
		String sSql = "SELECT SHF_EMPLOYEE_DAY_ID FROM SHIFTER.SHF_REPLACE_CANDIDATES WHERE SHF_EMPLOYEE_DAY_ID = ? ";
		
		DBAccess db = null;
		try {
			db = new DBAccess();
			db.prepareStatement(sSql);
			db.setLong(1,agendDay);
			db.executeQuery();
			
			if (db.next()) {
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.switchShiftExist", null));					
				throw new ShfException(actionErrors);				
			}
			
		} catch(DBQueryNoRowsException e){

		} catch (DBException e) {
			logger.error("error in checkIfSwitchShiftMade() : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in checkIfSwitchShiftMade() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}

	}		
	
	public static void checkIfSwitchBreakMade(long shiftId) throws ShfException{
		logger.debug("Starting checkIfSwitchBreakMade() dayId = " + shiftId);
		String sSql = "SELECT SHF_EMPLOYEE_DAY_ID FROM SHIFTER.SHF_REPLACE_BREAK_CANDIDATES WHERE SHF_EMPLOYEE_DAY_ID = ? ";
		
		DBAccess db = null;
		try {
			db = new DBAccess();
			db.prepareStatement(sSql);
			db.setLong(1, shiftId);
			db.executeQuery();
			
			if (db.next()) {
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.switchBreakExist", null));	
//				System.out.println("shf.error.switchBreakExist");
				throw new ShfSwitchBreakExistsException(actionErrors);				
			}
			
		} catch(DBQueryNoRowsException e){

		} catch (DBException e) {
			logger.error("error in checkIfSwitchBreakMade() : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e){
				logger.error("error in checkIfSwitchBreakMade() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
	}
	
	
	/////////// change requests ////////////
	
	public void setShiftChangeFormDefaults(){
		shiftChangeRequestForm.setMode("insert");
		if(shiftChangeRequestForm.getAllowedMoked()!=null){
			shiftChangeRequestForm.setMoked(shiftChangeRequestForm.getAllowedMoked());	
		}
		shiftChangeRequestForm.setDate(new Date());
		shiftChangeRequestForm.setStartFrom("07:00");
		shiftChangeRequestForm.setStartTo("07:00");
		shiftChangeRequestForm.setEndFrom("16:00");
		shiftChangeRequestForm.setEndTo("16:00");
		
		shiftChangeRequestForm.setNewStartTime("07:00");
		shiftChangeRequestForm.setNewEndTime("16:00");
		
		shiftChangeRequestForm.setAgentsNum(0);
		shiftChangeRequestForm.setShiftLength(0);
		
		shiftChangeRequestForm.setShiftStartOption(0);
		shiftChangeRequestForm.setShiftEndOption(0);
		shiftChangeRequestForm.setShiftLengthOption(0);
		
		shiftChangeRequestForm.setChangeEndSelected(0);
		shiftChangeRequestForm.setChangeStartSelected(0);
		
		shiftChangeRequestForm.setNewExtraMinutesAtStart(0);
		shiftChangeRequestForm.setNewLessMinutesAtStart(0);
		shiftChangeRequestForm.setNewExtraMinutesAtEnd(0);
		shiftChangeRequestForm.setNewLessMinutesAtEnd(0);
		
		shiftChangeRequestForm.setAutoApprove(1);
	}
	
	public void validateChangeRequest(Date reqDate,Date startFrom,Date startTo,Date endFrom,Date endTo,Date newStart,Date newEnd) throws ShfException {
		if(startFrom!=null && startTo!=null){
			//shf.error.startFromAfterStartTo
			if(startFrom.after(startTo)){
				throw new ShfException(new ActionError("shf.error.startFromAfterStartTo"));
			}
			String minBeforeChangeRequest=SHFParameters.getMinutesBeforeChangeRequest(shiftChangeRequestForm.getMoked()).getValue();
			int param=Integer.parseInt(minBeforeChangeRequest);
//			if(/*startFrom.before(new Date()) || */SHFUtils.getMinutesBetween(startFrom,new Date())<param && new Date().before(startFrom)){ //muted because of a request by Viki (Igal 7.2013)
//				throw new ShfException(new ActionError("shf.error.minBeforeCR",minBeforeChangeRequest));
//			}
			
		}
		if(endFrom!=null && endTo!=null){
			//shf.error.endFromAfterEndTo
			if(endFrom.after(endTo)){
				throw new ShfException(new ActionError("shf.error.endFromAfterEndTo"));
			}
		}
		if(startFrom!=null && endFrom!=null && startTo!=null){
			//shf.error.startToAfterEndFrom
			if(startTo.after(endFrom)){
				throw new ShfException(new ActionError("shf.error.startToAfterEndFrom"));
			}
		}
		if(shiftChangeRequestForm.getShiftLengthOption()>0 && shiftChangeRequestForm.getShiftLength()>0){
			String minShiftParam=SHFParameters.getMinimalShiftDuration(shiftChangeRequestForm.getMoked()).getValue();
			int param=Integer.parseInt(minShiftParam);
			if(param>shiftChangeRequestForm.getShiftLength()){
				throw new ShfException(new ActionError("shf.error.lowShiftDuration"));
			}
		}
		
		if(newStart!=null && newEnd!=null){
			if(newStart.after(newEnd)){
				throw new ShfException(new ActionError("shf.error.newStartAfterNewEnd"));
			}
		}
		
		if(newEnd!=null && startFrom!=null){
			if(startFrom.after(newEnd)){
				throw new ShfException(new ActionError("shf.error.illegalNewEnd"));
			}
		}
		
		if(newStart!=null && endTo!=null){
			if(newStart.after(endTo)){
				throw new ShfException(new ActionError("shf.error.illegalNewStart"));
			}
		}
	}
	
	public void addShiftChangeRequest() throws ShfException{
		StringBuffer sql=new StringBuffer();
		DBAccess db=null;
		
		Date reqDate=null,startFrom=null,startTo=null,endFrom=null,endTo=null,newStart=null,newEnd=null;
		
		try {
			reqDate=shiftChangeRequestForm.getDate();
			String strDate=BaseConvert.dateToString(reqDate,"dd/MM/yyyy");
			if(shiftChangeRequestForm.getShiftStartOption()==1){
				startFrom=BaseConvert.stringToDate(strDate+" "+shiftChangeRequestForm.getStartFrom(), "dd/MM/yyyy HH:mm");
				startTo=BaseConvert.stringToDate(strDate+" "+shiftChangeRequestForm.getStartTo(), "dd/MM/yyyy HH:mm");
			}
			
			if(shiftChangeRequestForm.getShiftEndOption()==1){
				endFrom=BaseConvert.stringToDate(strDate+" "+shiftChangeRequestForm.getEndFrom(), "dd/MM/yyyy HH:mm");
				endTo=BaseConvert.stringToDate(strDate+" "+shiftChangeRequestForm.getEndTo(), "dd/MM/yyyy HH:mm");
			}
			if(shiftChangeRequestForm.getChangeStartSelected()==1){
				if("newStartTime".equals(shiftChangeRequestForm.getChangeStartOption())){
					newStart=BaseConvert.stringToDate(strDate+" "+shiftChangeRequestForm.getNewStartTime(), "dd/MM/yyyy HH:mm");
				}
			}
			if(shiftChangeRequestForm.getChangeEndSelected()==1){
				if("newEndTime".equals(shiftChangeRequestForm.getChangeEndOption())){
					newEnd=BaseConvert.stringToDate(strDate+" "+shiftChangeRequestForm.getNewEndTime(), "dd/MM/yyyy HH:mm");
				}
			}
			
		} catch (ConvertException e) {
			logger.error("error in addShiftChangeRequest() "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}
		validateChangeRequest(reqDate,startFrom,startTo,endFrom,endTo,newStart,newEnd);
		
		sql.append("insert into SHIFTER.SHF_TIME_CHANGE_REQUEST(CHANGE_REQUEST_ID,REQUEST_DATE,");
		sql.append("ORG_UNIT_ID,ACTIVITY,AGENTS_NUMBER,AUTO_APPROVE,SHIFT_START_OPTION,");
		sql.append("SHIFT_END_OPTION,SHIFT_LENGTH_OPTION,SHIFT_START_FROM,SHIFT_START_TO," );
		sql.append("SHIFT_END_FROM,SHIFT_END_TO,SHIFT_LENGTH,CHANGE_START_SELECTED,");
		sql.append("CHANGE_END_SELECTED,CHANGE_START_OPTION,CHANGE_END_OPTION,NEW_START,NEW_END," );
		sql.append("EXTRA_MINUTES_START,LESS_MINUTES_START,EXTRA_MINUTES_END,LESS_MINUTES_END,CREATED_BY,CREATED_AT) " );
		sql.append("values(SHIFTER.SHF_SHIFT_CHANGE_ID.NEXTVAL,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ");
		
		try{
			db=new DBAccess();
			int param=1;
			db.prepareStatement(sql.toString());
			db.setDate(param++,reqDate);
			db.setString(param++,shiftChangeRequestForm.getMoked());
			db.setString(param++,shiftChangeRequestForm.getActivity());
			db.setInt(param++,shiftChangeRequestForm.getAgentsNum());
			db.setInt(param++,shiftChangeRequestForm.getAutoApprove());
			db.setInt(param++,shiftChangeRequestForm.getShiftStartOption());
			db.setInt(param++,shiftChangeRequestForm.getShiftEndOption());
			db.setInt(param++,shiftChangeRequestForm.getShiftLengthOption());
			db.setTimestamp(param++,startFrom);
			db.setTimestamp(param++,startTo);
			db.setTimestamp(param++,endFrom);
			db.setTimestamp(param++,endTo);
			db.setInt(param++,shiftChangeRequestForm.getShiftLength());
			db.setInt(param++,shiftChangeRequestForm.getChangeStartSelected());
			db.setInt(param++,shiftChangeRequestForm.getChangeEndSelected());
			db.setString(param++,shiftChangeRequestForm.getChangeStartOption());
			db.setString(param++,shiftChangeRequestForm.getChangeEndOption());
			db.setTimestamp(param++,newStart);
			db.setTimestamp(param++,newEnd);
			db.setInt(param++,shiftChangeRequestForm.getNewExtraMinutesAtStart());
			db.setInt(param++,shiftChangeRequestForm.getNewLessMinutesAtStart());
			db.setInt(param++,shiftChangeRequestForm.getNewExtraMinutesAtEnd());
			db.setInt(param++,shiftChangeRequestForm.getNewLessMinutesAtEnd());
			db.setString(param++,shiftChangeRequestForm.getUserFirstName()+" "+shiftChangeRequestForm.getUserLastName());
			db.setTimestamp(param++,new Date());
			db.executeUpdate();
		}catch(DBUpdateNoRowsException e){
			logger.error("error at addShiftChangeRequest(): "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}catch(DBException e){
			logger.error("error at addShiftChangeRequest(): "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}finally{
			try{
				db.close();
			}catch(DBException e){
				logger.error("error at addShiftChangeRequest() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
	}
	
	
	public Vector populateShiftChangeRequests() throws ShfException{
		Vector vec=new Vector();
		DBAccess db=null;
		StringBuffer sql=new StringBuffer();
		sql.append("select t.*,");
		sql.append("(select count(*) from SHIFTER.shf_time_change_candidates c where c.CHANGE_REQUEST_ID=t.change_request_id and c.APPROVE_TIME is not null ) APPROVED_NUM ");
		sql.append("from SHIFTER.shf_time_change_request t "); 
		sql.append("where t.change_request_id>0 ");
		if(shiftChangeRequestForm.getRequestId()>0){
			sql.append("AND t.change_request_id=? ");
		}
		if(shiftChangeRequestForm.getMoked()!=null){
			sql.append("AND t.org_unit_id=? ");
		}else{
			StringBuffer unitSelect = new StringBuffer("");
			unitSelect.append("AND t.org_unit_id IN (" );
			Vector allowedUnits = shiftChangeRequestForm.getAllowedUnits();
			Iterator  it = allowedUnits.iterator();
			while (it.hasNext()) {
				unitSelect.append( it.next()); 
				if (it.hasNext()) 
				unitSelect.append(","); 
			} 
			unitSelect.append(" )");
			sql.append(unitSelect);
		}
		if(shiftChangeRequestForm.getDate()!=null){
			sql.append("and t.request_date = ? ");
		}else{
			sql.append("and t.request_date >= ? ");
		}
		sql.append("order by t.request_date,t.SHIFT_START_FROM ");
		
		try{
			db=new DBAccess();
			int param=1;
			db.prepareStatement(sql.toString());
			if(shiftChangeRequestForm.getRequestId()>0){
				db.setLong(param++,shiftChangeRequestForm.getRequestId());
			}
			if(shiftChangeRequestForm.getMoked()!=null){
				db.setString(param++,shiftChangeRequestForm.getMoked());
			}
			if(shiftChangeRequestForm.getDate()!=null){
				db.setTimestamp(param++,shiftChangeRequestForm.getDate());
			}else{
				db.setDate(param++,new Date());
			}
			
			db.executeQuery();
			db.populate("bzq.shf.forms.ShiftChangeRequestForm",vec);
		}catch(DBQueryNoRowsException e){
			
		}catch(DBException e){
			logger.error("error at populateShiftTimeChangeRequests(): "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error at populateShiftTimeChangeRequests() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
		return vec;
	}
	
	public void updateApprovedShiftChangeRequest() throws ShfException{
		StringBuffer sql=new StringBuffer();
		sql.append("update SHIFTER.SHF_TIME_CHANGE_REQUEST t set ");
		sql.append("t.AGENTS_NUMBER=?,");
		sql.append("t.AUTO_APPROVE=?,");
		sql.append("t.MODIFIED_BY=?,");
		sql.append("t.MODIFIED_AT=? ");	
		sql.append("where t.CHANGE_REQUEST_ID=?");
		int param=1;
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setInt(param++,shiftChangeRequestForm.getAgentsNum());
			db.setInt(param++,shiftChangeRequestForm.getAutoApprove());
			db.setString(param++,shiftChangeRequestForm.getUserFirstName()+" "+shiftChangeRequestForm.getUserLastName());
			db.setTimestamp(param++,new Date());
			db.setLong(param++,shiftChangeRequestForm.getRequestId());
			db.executeUpdate();
		}catch(DBUpdateNoRowsException e){
			logger.error("error at updateApprovedShiftChangeRequest(): "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}catch(DBException e){
			logger.error("error at updateApprovedShiftChangeRequest(): "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}finally{
			try{
				db.close();
			}catch(DBException e){
				logger.error("error at updateApprovedShiftChangeRequest() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
	}
	/**
	 * 
	 */
	public void updateShiftChangeRequest() throws ShfException{
		if(shiftChangeRequestForm.getAprovedNum()>0){
			if(shiftChangeRequestForm.getAgentsNum()<shiftChangeRequestForm.getAprovedNum()){
				ActionError error=new ActionError("shf.error.changeRequestLowAgentsNum",String.valueOf(shiftChangeRequestForm.getAprovedNum()));
				throw new ShfException(error);
			}
			updateApprovedShiftChangeRequest();
			return;
		}
		StringBuffer sql=new StringBuffer();
		DBAccess db=null;

		Date reqDate=null,startFrom=null,startTo=null,endFrom=null,endTo=null,newStart=null,newEnd=null;

		try {
			reqDate=shiftChangeRequestForm.getDate();
			String strDate=BaseConvert.dateToString(reqDate,"dd/MM/yyyy");
			if(shiftChangeRequestForm.getShiftStartOption()==1){
				logger.debug("convert for startFrom & startTo");
				startFrom=BaseConvert.stringToDate(strDate+" "+shiftChangeRequestForm.getStartFrom(), "dd/MM/yyyy HH:mm");
				startTo=BaseConvert.stringToDate(strDate+" "+shiftChangeRequestForm.getStartTo(), "dd/MM/yyyy HH:mm");
			}
			if(shiftChangeRequestForm.getShiftEndOption()==1){
				logger.debug("convert for startFrom & startTo");
				endFrom=BaseConvert.stringToDate(strDate+" "+shiftChangeRequestForm.getEndFrom(), "dd/MM/yyyy HH:mm");
				endTo=BaseConvert.stringToDate(strDate+" "+shiftChangeRequestForm.getEndTo(), "dd/MM/yyyy HH:mm");
			}
			if(shiftChangeRequestForm.getChangeStartSelected()==1){
				if("newStartTime".equals(shiftChangeRequestForm.getChangeStartOption())){
					newStart=BaseConvert.stringToDate(strDate+" "+shiftChangeRequestForm.getNewStartTime(), "dd/MM/yyyy HH:mm");
				}
			}
			if(shiftChangeRequestForm.getChangeEndSelected()==1){
				if("newEndTime".equals(shiftChangeRequestForm.getChangeEndOption())){
					newEnd=BaseConvert.stringToDate(strDate+" "+shiftChangeRequestForm.getNewEndTime(), "dd/MM/yyyy HH:mm");
				}
			}
	
		} catch (ConvertException e) {
			logger.error("error in updateShiftChangeRequest() "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}
		
		validateChangeRequest(reqDate,startFrom,startTo,endFrom,endTo,newStart,newEnd);
		
		
		sql.append("update SHIFTER.SHF_TIME_CHANGE_REQUEST t set ");
		sql.append("t.REQUEST_DATE=?,");
		sql.append("t.ORG_UNIT_ID=?,");
		sql.append("t.ACTIVITY=?,");
		sql.append("t.AGENTS_NUMBER=?,");
		sql.append("t.AUTO_APPROVE=?,");
		sql.append("t.SHIFT_START_OPTION=?,");
		sql.append("t.SHIFT_END_OPTION=?,");
		sql.append("t.SHIFT_LENGTH_OPTION=?,");
		sql.append("t.SHIFT_START_FROM=?,");
		sql.append("t.SHIFT_START_TO=?,");
		sql.append("t.SHIFT_END_FROM=?,");
		sql.append("t.SHIFT_END_TO=?,");
		sql.append("t.SHIFT_LENGTH=?,");
		sql.append("t.CHANGE_START_SELECTED=?,");
		sql.append("t.CHANGE_END_SELECTED=?,");
		sql.append("t.CHANGE_START_OPTION=?,");
		sql.append("t.CHANGE_END_OPTION=?,");
		sql.append("t.NEW_START=?,");
		sql.append("t.NEW_END=?,");
		sql.append("t.EXTRA_MINUTES_START=?,");
		sql.append("t.LESS_MINUTES_START=?,");
		sql.append("t.EXTRA_MINUTES_END=?,");
		sql.append("t.LESS_MINUTES_END=?,");
		sql.append("t.MODIFIED_BY=?,");
		sql.append("t.MODIFIED_AT=? ");	
		sql.append("where t.CHANGE_REQUEST_ID=?");
		try{
			db=new DBAccess();
			int param=1;
			db.prepareStatement(sql.toString());
			db.setDate(param++,reqDate);
			db.setString(param++,shiftChangeRequestForm.getMoked());
			db.setString(param++,shiftChangeRequestForm.getActivity());
			db.setInt(param++,shiftChangeRequestForm.getAgentsNum());
			db.setInt(param++,shiftChangeRequestForm.getAutoApprove());
			db.setInt(param++,shiftChangeRequestForm.getShiftStartOption());
			db.setInt(param++,shiftChangeRequestForm.getShiftEndOption());
			db.setInt(param++,shiftChangeRequestForm.getShiftLengthOption());
			db.setTimestamp(param++,startFrom);
			db.setTimestamp(param++,startTo);
			db.setTimestamp(param++,endFrom);
			db.setTimestamp(param++,endTo);
			db.setInt(param++,shiftChangeRequestForm.getShiftLength());
			db.setInt(param++,shiftChangeRequestForm.getChangeStartSelected());
			db.setInt(param++,shiftChangeRequestForm.getChangeEndSelected());
			db.setString(param++,shiftChangeRequestForm.getChangeStartOption());
			db.setString(param++,shiftChangeRequestForm.getChangeEndOption());
			db.setTimestamp(param++,newStart);
			db.setTimestamp(param++,newEnd);
			db.setInt(param++,shiftChangeRequestForm.getNewExtraMinutesAtStart());
			db.setInt(param++,shiftChangeRequestForm.getNewLessMinutesAtStart());
			db.setInt(param++,shiftChangeRequestForm.getNewExtraMinutesAtEnd());
			db.setInt(param++,shiftChangeRequestForm.getNewLessMinutesAtEnd());
			db.setString(param++,shiftChangeRequestForm.getUserFirstName()+" "+shiftChangeRequestForm.getUserLastName());
			db.setTimestamp(param++,new Date());
			db.setLong(param++,shiftChangeRequestForm.getRequestId());
			db.executeUpdate();
		}catch(DBUpdateNoRowsException e){
			logger.error("error at updateShiftChangeRequest(): "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}catch(DBException e){
			logger.error("error at updateShiftChangeRequest(): "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}finally{
			try{
				db.close();
			}catch(DBException e){
				logger.error("error at updateShiftChangeRequest() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
		
	}
	/**
	 * 
	 */
	public Vector populateChangeRequestOptions() throws ShfException{
		Vector vec=null;
		StringBuffer sql=new StringBuffer();
		sql.append("select distinct d.*, ");
		
		//sql.append("t.APPROVE_TIME, ");
		//sql.append("t.CREATION_TIME, ");
		//sql.append("t.MODIFICATION_TIME, ");
		//sql.append("t.MODIFICATION_USER, ");
		//sql.append("t.CHANGE_REQUEST_ID, ");
		
		sql.append("c.NEW_ACTIVITY, ");
		sql.append("c.NEW_DAY_END, ");
		sql.append("c.NEW_DAY_START, ");
		sql.append("c.NEW_DAY_TYPE, ");
		sql.append("c.NEW_EMPLOYEE_ID, ");
		sql.append("c.NEW_EXCEPTION_TYPE_ID, ");
		sql.append("c.NEW_PAID_MINUTES, ");
		sql.append("c.NEW_SHIFT_END, ");
		sql.append("c.NEW_SHIFT_START, ");
		sql.append("c.NEW_SITE_ID, ");
		sql.append("c.NEW_TIMEOFF_TYPE_ID, ");
		sql.append("c.NEW_WORK_MINUTES, ");
		sql.append("c.START_CHANGE_REASON, ");
		sql.append("c.END_CHANGE_REASON, ");
		sql.append("c.SWITCH_DAY_ID, ");
		sql.append("c.MODIFICATION_TIME, ");
		sql.append("c.MODIFICATION_USER, ");

		sql.append("a.STAGE_ARRIVAL_TIME ,  ");
		sql.append("a.STATION_ARRIVAL_TIME ,  ");
		sql.append("a.STAGE_ARRIVAL_USER , ");
		sql.append("a.STATION_ARRIVAL_USER ,  ");
		sql.append("a.LATE_MINUTES , ");
		sql.append("a.LATE_REASON_ID , ");
		sql.append("a.MISS_REASON_ID , ");
		sql.append("a.MISSING_TIME , ");
		sql.append("a.MISSING_REMARK , ");
		sql.append("a.LATE_REMARK , ");
		sql.append("a.STATION_EXIT_TIME, ");
		sql.append("a.STATION_EXIT_USER, ");

		sql.append("e.EMPLOYEE_ID, ");
		sql.append("e.LAST_NAME, ");
		sql.append("e.FIRST_NAME, ");
		sql.append("e.JOB_ID, ");
		sql.append("e.ORG_UNIT_ID ");

		sql.append("from SHIFTER.shf_employee_day d ");
		sql.append("left join SHIFTER.shf_day_changes c on d.shf_employee_day_id=c.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_time_change_candidates t on t.EMPLOYEE_DAY_ID=d.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = NVL(c.NEW_EMPLOYEE_ID,d.emp_id_number) ");
		sql.append("left join SHIFTER.shf_attendance a on d.shf_employee_day_id=a.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_org_unit u on u.org_unit_id = e.org_unit_id ");
		
		sql.append("where e.employee_id is not null AND NVL(c.NEW_DAY_TYPE,d.WM_DAY_TYPE)=? "); 
		sql.append("and d.WM_SITE_ID=? and(( ");
		
		if(shiftChangeRequestForm.getShiftStartOption()==1)
			sql.append("nvl(c.NEW_SHIFT_START,d.wm_shift_start_datetime) >= ? AND nvl(c.NEW_SHIFT_START,d.wm_shift_start_datetime) <= ? "); 
		else
			sql.append("to_date(nvl(c.NEW_SHIFT_START,d.wm_shift_start_datetime)) = ? "); 
		if(shiftChangeRequestForm.getShiftEndOption()==1)
			sql.append("and nvl(c.NEW_SHIFT_END,d.wm_shift_end_datetime) >= ? AND nvl(c.NEW_SHIFT_END,d.wm_shift_end_datetime) <= ? "); 
		if(shiftChangeRequestForm.getShiftLengthOption()==1)
			sql.append("and (nvl(c.NEW_SHIFT_END,d.wm_shift_end_datetime)-nvl(c.NEW_SHIFT_START,d.wm_shift_start_datetime))*24*60 = ? ");
		
		//או שהמשמרת אושרה כבר עבור בקשה אחרת או שהיא לא משוייכת לשום בקשה
		sql.append(") and (t.CHANGE_REQUEST_ID is null or (t.CHANGE_REQUEST_ID <> ? and t.APPROVE_TIME is not null) ) )");
		
		int param=1;
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setInt(param++,SHFConstants.DAY_TYPE_ACTIVITY);
			db.setString(param++,SHFTableUtils.getSiteCodeOfUnit(shiftChangeRequestForm.getMoked()));
			if(shiftChangeRequestForm.getShiftStartOption()==1){
				db.setTimestamp(param++,shiftChangeRequestForm.getStartFromDate());
				db.setTimestamp(param++,shiftChangeRequestForm.getStartToDate());
			}else{
				db.setDate(param++,shiftChangeRequestForm.getDate());
			}
			if(shiftChangeRequestForm.getShiftEndOption()==1){
				db.setTimestamp(param++,shiftChangeRequestForm.getEndFromDate());
				db.setTimestamp(param++,shiftChangeRequestForm.getEndToDate());
			}
			if(shiftChangeRequestForm.getShiftLengthOption()==1){
				db.setInt(param++,shiftChangeRequestForm.getShiftLength());
			}
			db.setLong(param++,shiftChangeRequestForm.getRequestId());
			db.executeQuery();
			vec=new Vector();
			ChangeRequestCandidate candidate=null;
			while(db.next()){
				candidate=new ChangeRequestCandidate();
				db.populate(candidate);
				if(SHFTableUtils.isActivitiesEquals(candidate.getShiftActivity(),shiftChangeRequestForm.getActivity()))
					vec.add(candidate);
			}
			
		}catch(DBQueryNoRowsException e){
			
		}catch(DBException e){
			logger.error("error at populateChangeRequestOptions(): "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}finally{
			try{
				db.close();
			}catch(DBException e){
				logger.error("error at populateChangeRequestOptions() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
		return vec;
	}
	
	public ChangeRequestCandidate populateChangeRequestOptionsForAgent(String idNumber,ShiftChangeRequestForm changeForm) throws ShfException{
			StringBuffer sql=new StringBuffer();
			sql.append("select d.*, ");
		
			sql.append("t.APPROVE_TIME, ");
			sql.append("t.CREATION_TIME, ");
			sql.append("t.MODIFICATION_TIME, ");
			sql.append("t.MODIFICATION_USER, ");
			sql.append("t.CHANGE_REQUEST_ID, ");
		
			sql.append("c.NEW_ACTIVITY, ");
			sql.append("c.NEW_DAY_END, ");
			sql.append("c.NEW_DAY_START, ");
			sql.append("c.NEW_DAY_TYPE, ");
			sql.append("c.NEW_EMPLOYEE_ID, ");
			sql.append("c.NEW_EXCEPTION_TYPE_ID, ");
			sql.append("c.NEW_PAID_MINUTES, ");
			sql.append("c.NEW_SHIFT_END, ");
			sql.append("c.NEW_SHIFT_START, ");
			sql.append("c.NEW_SITE_ID, ");
			sql.append("c.NEW_TIMEOFF_TYPE_ID, ");
			sql.append("c.NEW_WORK_MINUTES, ");
			sql.append("c.START_CHANGE_REASON, ");
			sql.append("c.END_CHANGE_REASON, ");
			sql.append("c.SWITCH_DAY_ID, ");
			sql.append("c.MODIFICATION_TIME, ");
			sql.append("c.MODIFICATION_USER, ");

			sql.append("a.STAGE_ARRIVAL_TIME ,  ");
			sql.append("a.STATION_ARRIVAL_TIME ,  ");
			sql.append("a.STAGE_ARRIVAL_USER , ");
			sql.append("a.STATION_ARRIVAL_USER ,  ");
			sql.append("a.LATE_MINUTES , ");
			sql.append("a.LATE_REASON_ID , ");
			sql.append("a.MISS_REASON_ID , ");
			sql.append("a.MISSING_TIME , ");
			sql.append("a.MISSING_REMARK , ");
			sql.append("a.LATE_REMARK , ");
			sql.append("a.STATION_EXIT_TIME, ");
			sql.append("a.STATION_EXIT_USER, ");

			sql.append("e.EMPLOYEE_ID, ");
			sql.append("e.LAST_NAME, ");
			sql.append("e.FIRST_NAME, ");
			sql.append("e.JOB_ID, ");
			sql.append("e.ORG_UNIT_ID ");
			
			sql.append("from SHIFTER.shf_employee_day d ");
			sql.append("left join SHIFTER.shf_day_changes c on d.shf_employee_day_id=c.shf_employee_day_id ");
			sql.append("left join SHIFTER.shf_time_change_candidates t on t.EMPLOYEE_DAY_ID=d.shf_employee_day_id ");
			sql.append("left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = NVL(c.NEW_EMPLOYEE_ID,d.emp_id_number) ");
			sql.append("left join SHIFTER.shf_attendance a on d.shf_employee_day_id=a.shf_employee_day_id ");
			sql.append("left join SHIFTER.shf_org_unit u on u.org_unit_id = e.org_unit_id ");
		
			sql.append("where e.employee_id is not null AND e.emp_id_number=? AND NVL(c.NEW_DAY_TYPE,d.WM_DAY_TYPE)=? "); 
			sql.append("and d.WM_SITE_ID=? and( (");
		
			if(changeForm.getShiftStartOption()==1)
				sql.append("nvl(c.NEW_SHIFT_START,d.wm_shift_start_datetime) >= ? AND nvl(c.NEW_SHIFT_START,d.wm_shift_start_datetime) <= ? "); 
			else
				sql.append("to_date(nvl(c.NEW_SHIFT_START,d.wm_shift_start_datetime)) = ? "); 
			if(changeForm.getShiftEndOption()==1)
				sql.append("and nvl(c.NEW_SHIFT_END,d.wm_shift_end_datetime) >= ? AND nvl(c.NEW_SHIFT_END,d.wm_shift_end_datetime) <= ? "); 
			if(changeForm.getShiftLengthOption()==1)
				sql.append("and (nvl(c.NEW_SHIFT_END,d.wm_shift_end_datetime)-nvl(c.NEW_SHIFT_START,d.wm_shift_start_datetime))*24*60 = ? ");
		
			sql.append(") ) ");
			//and (t.CHANGE_REQUEST_ID <> ? or t.CHANGE_REQUEST_ID is null)
			
			int param=1;
			DBAccess db=null;
			try{
				db=new DBAccess();
				db.prepareStatement(sql.toString());
				db.setString(param++,idNumber);
				db.setInt(param++,SHFConstants.DAY_TYPE_ACTIVITY);
				db.setString(param++,SHFTableUtils.getSiteCodeOfUnit(changeForm.getMoked()));
				if(changeForm.getShiftStartOption()==1){
					db.setTimestamp(param++,changeForm.getStartFromDate());
					db.setTimestamp(param++,changeForm.getStartToDate());
				}else{
					db.setDate(param++,changeForm.getDate());
				}
				if(changeForm.getShiftEndOption()==1){
					db.setTimestamp(param++,changeForm.getEndFromDate());
					db.setTimestamp(param++,changeForm.getEndToDate());
				}
				if(changeForm.getShiftLengthOption()==1){
					db.setInt(param++,changeForm.getShiftLength());
				}
				
				db.executeQuery();
				ChangeRequestCandidate candidate=null;
				if(db.next()){
					candidate=new ChangeRequestCandidate();
					db.populate(candidate);
					if(candidate.getRequestId()!=changeForm.getRequestId()){
						candidate.setRequestId(0);
						candidate.setApproveTime(null);
						candidate.setCreationTime(null);
						candidate.setModificationTime(null);
						candidate.setModificationUser(null);
					}
					if(SHFTableUtils.isActivitiesEquals(candidate.getShiftActivity(),changeForm.getActivity()))
						return candidate;
				}
				
			}catch(DBQueryNoRowsException e){
			
			}catch(DBException e){
				logger.error("error at populateChangeRequestOptions(): "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}finally{
				try{
					db.close();
				}catch(DBException e){
					logger.error("error at populateChangeRequestOptions() while closing db connection: "+e.getMessage());
					ActionErrors actionErrors = new ActionErrors();
					actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
					throw new ShfException(actionErrors);
				}
			}
			return null;
		}
		
	public void populateChangeRequestApplications() throws ShfException{
		int param=1;
		DBAccess db=null;
		StringBuffer sql=new StringBuffer();
		sql.append("select d.*, ");
		sql.append("c.NEW_ACTIVITY, ");
		sql.append("c.NEW_DAY_END, ");
		sql.append("c.NEW_DAY_START, ");
		sql.append("c.NEW_DAY_TYPE, ");
		sql.append("c.NEW_EMPLOYEE_ID, ");
		sql.append("c.NEW_EXCEPTION_TYPE_ID, ");
		sql.append("c.NEW_PAID_MINUTES, ");
		sql.append("c.NEW_SHIFT_END, ");
		sql.append("c.NEW_SHIFT_START, ");
		sql.append("c.NEW_SITE_ID, ");
		sql.append("c.NEW_TIMEOFF_TYPE_ID, ");
		sql.append("c.NEW_WORK_MINUTES, ");
		sql.append("c.START_CHANGE_REASON, ");
		sql.append("c.END_CHANGE_REASON, ");
		sql.append("c.SWITCH_DAY_ID, ");
		sql.append("c.MODIFICATION_TIME, ");
		sql.append("c.MODIFICATION_USER, ");
		
		sql.append("a.STAGE_ARRIVAL_TIME ,  ");
		sql.append("a.STATION_ARRIVAL_TIME ,  ");
		sql.append("a.STAGE_ARRIVAL_USER , ");
		sql.append("a.STATION_ARRIVAL_USER ,  ");
		sql.append("a.LATE_MINUTES , ");
		sql.append("a.LATE_REASON_ID , ");
		sql.append("a.MISS_REASON_ID , ");
		sql.append("a.MISSING_TIME , ");
		sql.append("a.MISSING_REMARK , ");
		sql.append("a.LATE_REMARK , ");
		sql.append("a.STATION_EXIT_TIME, ");
		sql.append("a.STATION_EXIT_USER, ");
		
		sql.append("e.EMPLOYEE_ID, ");
		sql.append("e.LAST_NAME, ");
		sql.append("e.FIRST_NAME, ");
		sql.append("e.JOB_ID, ");
		sql.append("e.ORG_UNIT_ID, ");
		
		sql.append("t.CHANGE_REQUEST_ID, ");
		sql.append("t.APPROVE_TIME, ");
		sql.append("t.CREATION_TIME, ");
		sql.append("t.MODIFICATION_TIME, ");
		sql.append("t.MODIFICATION_USER ");
				
		sql.append("from SHIFTER.SHF_TIME_CHANGE_CANDIDATES t ");
		sql.append("left join SHIFTER.shf_employee_day d on t.EMPLOYEE_DAY_ID=d.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_day_changes c on d.shf_employee_day_id=c.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_employees e on substr(e.emp_id_number,1,8) = NVL(c.NEW_EMPLOYEE_ID,d.emp_id_number) ");
		sql.append("left join SHIFTER.shf_attendance a on d.shf_employee_day_id=a.shf_employee_day_id ");
		sql.append("left join SHIFTER.shf_org_unit u on u.org_unit_id = e.org_unit_id ");
		
		sql.append("where t.CHANGE_REQUEST_ID=? ");
		
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setLong(param++,shiftChangeRequestForm.getRequestId());
			db.executeQuery();
			Vector applications=new Vector();
			db.populate("bzq.shf.bean.ChangeRequestCandidate",applications);
			shiftChangeRequestForm.setAgentDaysApplications(applications);
		}catch(DBQueryNoRowsException e){
			
		}catch(DBException e){
			logger.error("error at populateChangeRequestApplications(): "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}finally{
			try{
				db.close();
			}catch(DBException e){
				logger.error("error at populateChangeRequestApplications() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
		
	}
	
	/*
	 * get vector of all change request 
	 * return only the appropriate change requests.
	 */
	public Vector populateChangeRequestOfAgent(String idNumber,Vector vec) throws ShfException{
		Vector agent_requests=new Vector();
		for(int i=0;i<vec.size();i++){
			ShiftChangeRequestForm shiftChange=(ShiftChangeRequestForm)vec.get(i);
			ChangeRequestCandidate candidate = populateChangeRequestOptionsForAgent(idNumber,shiftChange);
			if(candidate!=null) {
				shiftChange.setCandidate(candidate);
				agent_requests.add(shiftChange);
			}
		}
		return agent_requests;
	}
	
	public void updateAgentDayTime(AgentDayBean agentDay) throws ShfException{
		//update shift from massive change
		//TODO - HASAVA - updateAgentDayTime - D
		StringBuffer sql=new StringBuffer();
		int param=1;
		if(agentDay.getAgentDayId()==0 || ( agentDay.getNewShiftStart()==null && agentDay.getNewShiftEnd()==null)){
			logger.error("error in updateAgentDayTime nothing to be updated");
			return;
		}
				
		//HASAVA - start
		AgentDayBean hasavaDayBean = populateShift(agentDay.getAgentDayId());
		//HASAVA - end
		
		sql.append("update SHIFTER.SHF_DAY_CHANGES c set ");
		sql.append("c.MODIFICATION_USER = ?, "); //1
		if(agentDay.getNewShiftStart()!=null) {
			sql.append("c.NEW_SHIFT_START = ?, "); //3
			sql.append("c.NEW_DAY_START = ?, "); //4
		}
		if(agentDay.getNewShiftEnd()!=null) {
			sql.append("c.NEW_SHIFT_END = ?, "); //5
			sql.append("c.NEW_DAY_END = ?, "); //6
		}
		sql.append("c.MODIFICATION_TIME = ? "); //7
		sql.append("where c.SHF_EMPLOYEE_DAY_ID = ?"); //8
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setString(param++,shiftChangeRequestForm.getUserFirstName()+" "+shiftChangeRequestForm.getUserLastName()); //1
			if(agentDay.getNewShiftStart()!=null) {
				db.setTimestamp(param++,agentDay.getNewShiftStart()); //3
				db.setTimestamp(param++,agentDay.getNewShiftStart()); //4
			}
			if(agentDay.getNewShiftEnd()!=null) {
				db.setTimestamp(param++,agentDay.getNewShiftEnd()); //5
				db.setTimestamp(param++,agentDay.getNewShiftEnd()); //6
			}
			db.setTimestamp(param++,new Date()); //7
			db.setLong(param++,agentDay.getAgentDayId()); //8
			db.executeUpdate();
		} catch (DBUpdateNoRowsException e){
			sql=new StringBuffer();
			param=1;
			sql.append("insert into SHIFTER.SHF_DAY_CHANGES");
			sql.append("(SHF_EMPLOYEE_DAY_ID,NEW_SHIFT_START,NEW_SHIFT_END,MODIFICATION_TIME,MODIFICATION_USER, ");
			//HASAVA - start
			sql.append("NEW_DAY_START, "); //6
			sql.append("NEW_DAY_END, "); //7
			sql.append(" NEW_EMPLOYEE_ID ,"); //8
			sql.append(" NEW_ACTIVITY ,"); //9
			sql.append(" NEW_DAY_TYPE ,"); //10
			sql.append(" NEW_EXCEPTION_TYPE_ID ,"); //11
			sql.append(" NEW_PAID_MINUTES ,"); //12
			sql.append(" NEW_SITE_ID ,"); //13
			sql.append(" NEW_TIMEOFF_TYPE_ID ,"); //14
			sql.append(" NEW_WORK_MINUTES ) "); //15
			//HASAVA - end
			sql.append("values(?,?,?,?,?,");
			//HASAVA - start
			sql.append("?, "); //6
			sql.append("?, "); //7
			sql.append("?, "); //8
			sql.append("?, "); //9
			sql.append("?, "); //10
			sql.append("?, "); //11
			sql.append("?, "); //12
			sql.append("?, "); //13
			sql.append("?, "); //14
			sql.append("? )"); //15
			//HASAVA - end
			try{
				db.prepareStatement(sql.toString());
				db.setLong(param++,agentDay.getAgentDayId()); //1
				db.setTimestamp(param++,agentDay.getNewShiftStart()); //2
				db.setTimestamp(param++,agentDay.getNewShiftEnd()); //3
				db.setTimestamp(param++,new Date()); //4
				db.setString(param++,shiftChangeRequestForm.getUserFirstName()+" "+shiftChangeRequestForm.getUserLastName()); //5
				//HASAVA - start
				db.setTimestamp(param++,agentDay.getNewShiftStart()); //6
				db.setTimestamp(param++,agentDay.getNewShiftEnd()); //7
				db.setString(param++, hasavaDayBean.getEmpIdNumber()); //8
				db.setString(param++, hasavaDayBean.getShiftActivity()); //9
				db.setInt(param++, hasavaDayBean.getDayType()); //10
				db.setInt(param++, hasavaDayBean.getWmExceptionId()); //11
				db.setInt(param++, hasavaDayBean.getPaidMinutes()); //12
				db.setString(param++, hasavaDayBean.getSiteId()); //13
				db.setInt(param++, hasavaDayBean.getTimeoffTypeId()); //14
				db.setInt(param++, hasavaDayBean.getWorkMinutes()); //15
				//HASAVA - end
				db.executeUpdate();
			} catch(DBException e1){
				logger.error("error at updateAgentDayTime(): "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		} catch(DBException e){
			logger.error("error at updateAgentDayTime(): "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try{
				db.close();
			}catch(DBException e){
				logger.error("error at updateAgentDayTime() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
		
	}
	/**
	 * @param agentDay
	 */
	public void setAgentDayTimeByChangeRequest(AgentDayBean agentDay) throws ShfException {
		if(shiftChangeRequestForm.getChangeStartSelected()==1){
			if(shiftChangeRequestForm.getChangeStartOption().equals("newStartTime")){
				agentDay.setNewShiftStart(shiftChangeRequestForm.getNewStartTimeDate());
			}else if(shiftChangeRequestForm.getChangeStartOption().equals("newExtraMinutesAtStart")){
				int extraMinutes=shiftChangeRequestForm.getNewExtraMinutesAtStart();
				agentDay.setNewShiftStart(SHFUtils.getTimeCalc(agentDay.getShiftStart(),extraMinutes*-1));
			}else if(shiftChangeRequestForm.getChangeStartOption().equals("newLessMinutesAtStart")){
				int lessMinutes=shiftChangeRequestForm.getNewLessMinutesAtStart();
				agentDay.setNewShiftStart(SHFUtils.getTimeCalc(agentDay.getShiftStart(),lessMinutes));
			}
		}
		if(shiftChangeRequestForm.getChangeEndSelected()==1){
			if(shiftChangeRequestForm.getChangeEndOption().equals("newEndTime")){
				agentDay.setNewShiftEnd(shiftChangeRequestForm.getNewEndTimeDate());
			}else if(shiftChangeRequestForm.getChangeEndOption().equals("newExtraMinutesAtEnd")){
				int extraMinutes=shiftChangeRequestForm.getNewExtraMinutesAtEnd();
				agentDay.setNewShiftEnd(SHFUtils.getTimeCalc(agentDay.getShiftEnd(),extraMinutes));
			}else if(shiftChangeRequestForm.getChangeEndOption().equals("newLessMinutesAtEnd")){
				int lessMinutes=shiftChangeRequestForm.getNewLessMinutesAtEnd();
				agentDay.setNewShiftEnd(SHFUtils.getTimeCalc(agentDay.getShiftEnd(),lessMinutes*-1));
			}
		}
		
		String max=SHFParameters.getMaximalShiftDuration(agentDay.getOrgUnitCode()).getValue();
		String min=SHFParameters.getMinimalShiftDurationForCR(agentDay.getOrgUnitCode()).getValue();
		int duration=SHFUtils.getMinutesBetween(agentDay.getShiftStart(),agentDay.getShiftEnd());
		if(duration>Integer.parseInt(max)){
			throw new ShfException(new ActionError("shf.error.maxShiftDurationCR"));
		}
		if(duration<Integer.parseInt(min)){
			throw new ShfException(new ActionError("shf.error.minShiftDurationCR"));
		}
	}
	/**
	 * @param agentDay
	 */
	public void updateCandidateToChangeRequest(ChangeRequestCandidate requestCandidate,AgentDayBean agentDay) throws ShfException {
		StringBuffer sql=new StringBuffer();
		checkIfSwitchShiftMade(requestCandidate.getAgentDayId());
		checkIfSwitchBreakMade(requestCandidate.getAgentDayId());
		
		String minBeforeCR=SHFParameters.getMinutesBeforeChangeRequest(agentDay.getOrgUnitCode()).getValue();
		int minutesBeforeCR=Integer.parseInt(minBeforeCR);
//		if(/*agentDay.getShiftStart().before(new Date()) ||*/ SHFUtils.getMinutesBetween(agentDay.getShiftStart(),new Date())<=minutesBeforeCR && new Date().before(agentDay.getShiftStart())){
//			throw new ShfException(new ActionError("shf.error.minBeforeCR",minBeforeCR));
//		}
				
		int param=1;
		sql.append("UPDATE SHIFTER.shf_time_change_candidates set ");
		sql.append("APPROVE_TIME=? ,");
		sql.append("MODIFICATION_USER=? ,");
		sql.append("MODIFICATION_TIME=? ");
		sql.append("WHERE CHANGE_REQUEST_ID=? AND EMPLOYEE_DAY_ID=?");
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setTimestamp(param++,requestCandidate.getApproveTime());
			db.setString(param++,requestCandidate.getModificationUser());
			db.setTimestamp(param++,requestCandidate.getModificationTime());
			db.setLong(param++,requestCandidate.getRequestId());
			db.setLong(param++,requestCandidate.getAgentDayId());
			db.executeUpdate();
		} catch (DBUpdateNoRowsException e){
			param=1;
			sql=new StringBuffer();
			sql.append("insert into SHIFTER.shf_time_change_candidates(CHANGE_REQUEST_ID,EMPLOYEE_DAY_ID,APPROVE_TIME,MODIFICATION_USER,MODIFICATION_TIME,CREATION_TIME) values(?,?,?,?,?,?)");
			
			try {
				db.prepareStatement(sql.toString());
				db.setLong(param++,requestCandidate.getRequestId());
				db.setLong(param++,requestCandidate.getAgentDayId());
				db.setTimestamp(param++,requestCandidate.getApproveTime());
				db.setString(param++,requestCandidate.getModificationUser());
				db.setTimestamp(param++,requestCandidate.getModificationTime());
				db.setTimestamp(param++,requestCandidate.getCreationTime());
				db.executeUpdate();
			} catch (DBException e1) {
				logger.error("error at updateCandidateToChangeRequest(): "+e1.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
				
			
		} catch(DBException e){
			logger.error("error at updateCandidateToChangeRequest(): "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try{
				db.close();
			}catch(DBException e){
				logger.error("error at updateCandidateToChangeRequest() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
	}
	/**
	 * @param l
	 */
	public void rejectCandidate(long agentDay) throws ShfException{
		logger.info("rejecting change request candidate, agentDay="+agentDay);
		StringBuffer sql=new StringBuffer();
		sql.append("delete from SHIFTER.shf_time_change_candidates t where t.APPROVE_TIME is null and t.CHANGE_REQUEST_ID=? and t.EMPLOYEE_DAY_ID=?");
		int param=1;
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setLong(param++,shiftChangeRequestForm.getRequestId());
			db.setLong(param++,agentDay);
			db.executeUpdate();
			
		} catch(DBException e){
			logger.error("error at rejectCandidate(): "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try{
				db.close();
			}catch(DBException e){
				logger.error("error at rejectCandidate() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
	}
	/**
	 * 
	 */
	/*public void registerCandidate(ChangeRequestCandidate candidate) throws ShfException{
		checkIfSwitchBreakMade(shiftForm.getAgentDayId());
		checkIfSwitchShiftMade(shiftForm.getAgentDayId());
		
		StringBuffer sql=new StringBuffer();
		sql.append("insert into SHIFTER.shf_time_change_candidates(CHANGE_REQUEST_ID,EMPLOYEE_DAY_ID,APPROVE_TIME,MODIFICATION_USER,MODIFICATION_TIME,CREATION_TIME) values(?,?,?,?,?,?)");
		int param=1;
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setLong(param++,candidate.getRequestId());
			db.setLong(param++,candidate.getAgentDayId());
			db.setTimestamp(param++,candidate.getApproveTime());
			db.setTimestamp(param++,candidate.getModificationTime());
			db.setString(param++,candidate.getModificationUser());
			db.setTimestamp(param++,candidate.getCreationTime());
			db.executeUpdate();
		} catch(DBException e){
			logger.error("error at rejectCandidate(): "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try{
				db.close();
			}catch(DBException e){
				logger.error("error at rejectCandidate() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
	}*/
	
	public void sendChangeRequestMessages(AgentDayBean day,int messageType) throws ShfException{
		ReplaceMassage repMessage = new ReplaceMassage();
		ReplaceMassageDao repMessageDao = new ReplaceMassageDao();
		StringBuffer body=new StringBuffer();
		String subject=null;
		
		String startDateTime =  BaseConvert.dateToString(day.getShiftStart(),"dd/MM/yyyy HH:mm");
		String endDateTime = BaseConvert.dateToString(day.getShiftEnd(),"dd/MM/yyyy HH:mm");
		
		switch(messageType){
			case 1:
				subject="דחיית בקשת שינוי משמרת";
				body.append("בקשתך לשינוי משמרת המתחילה ב :");
				body.append(startDateTime);
				body.append(" נדחתה.");
			break;
			
			case 2:
				subject="אישור בקשת שינוי משמרת";
				body.append("בקשתך לשינוי משמרת המתחילה ב :");
				body.append(startDateTime);
				body.append(" אושרה.");
			break;
			
		}
		repMessage.setEmpId(day.getEmployeeId());
		repMessage.setIsRead("0");
		repMessage.setSubject(subject);
		repMessage.setText(body.toString()); 
		repMessageDao.insert(repMessage);	
	}
	
	/**
	 * 
	 */
	public void deleteShiftChangeRequest() throws ShfException {
		rejectAllUnApproved();
		deleteRequest();
	}
	
	public void rejectAllUnApproved() throws ShfException {
		populateChangeRequestApplications();
		Vector applications=shiftChangeRequestForm.getAgentDaysApplications();
		if(applications!=null){

			ChangeRequestCandidate candidate=null;
			for(int i=0;i<applications.size();i++){
				candidate=(ChangeRequestCandidate)applications.get(i);
				if(candidate.getApproveTime()==null){
					rejectCandidate(candidate.getAgentDayId());
					sendChangeRequestMessages(candidate,1);
				}
			}
		}
	}
	
	private void deleteRequest() throws ShfException {
		StringBuffer sql=new StringBuffer();
		sql.append("delete from SHIFTER.SHF_TIME_CHANGE_REQUEST t where t.CHANGE_REQUEST_ID=?");
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setLong(1,shiftChangeRequestForm.getRequestId());
			db.executeUpdate();
		}catch(DBUpdateNoRowsException e){
			logger.error("error at deleteShiftChangeRequest(): "+e.getMessage());
				
		}catch(DBException e){
			logger.error("error at deleteShiftChangeRequest(): "+e.getMessage());
				
		}finally{
			try{
				db.close();
			}catch(DBException e){
				logger.error("error at deleteShiftChangeRequest() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
		
	}
	
	public void deleteFromRepositories() throws ShfException{
		logger.info("beginning delete shift from shifts repository");
		ReplaceModel replaceModel=new ReplaceModel();
		AgentDayBean day=populateShift(shiftForm.getAgentDayId());
		ReplaceByCritrion critrion=new ReplaceByCritrion();
		critrion.setShiftId(String.valueOf(day.getAgentDayId()));
		critrion.setStartTime(day.getShiftStart());
		critrion.setEndTime(day.getShiftEnd());
		critrion.setFullname(day.getFirstName()+" "+day.getLastName());
		critrion.setActivity(this.shiftForm.getActivity()[0]);
		critrion.setEmployeeId(String.valueOf(this.shiftForm.getEmployeeId()));
		critrion.setSite(this.shiftForm.getSiteId());
		replaceModel.cancelShiftReplace(critrion);
		
		///////
		
		logger.info("beginning delete shift from breaks repository");
		BreakDataModel breakDataModel=new BreakDataModel();
		breakDataModel.deleteAllBreaksFromCandidate(shiftForm.getAgentDayId());
	}
	
	public void saveRemark() throws ShfException{
		logger.info("beginning save remark for: "+shiftForm.getAgentDayId());
		StringBuffer sql=new StringBuffer();
		sql.append("update SHIFTER.SHF_EMPLOYEE_DAY t set t.REMARK = ? where t.shf_employee_day_id=?");
		int param=1;
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setString(param++,shiftForm.getRemark());
			db.setLong(param++,shiftForm.getAgentDayId());
			db.executeUpdate();
			
		} catch(DBException e){
			logger.error("error at saveRemark(): "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try{
				db.close();
				
			}catch(DBException e){
				logger.error("error at saveRemark() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
	}
	
	private void validate_addShift(AgentDayBean day,Vector<BreakBean> breaks, String action) throws ShfException{
		if(day.getShiftEnd().before(day.getShiftStart())){
			throw new ShfException(new ActionError("shf.error.endBeforeStart"));
		}
		
		if(GenericValidator.isBlankOrNull(day.getSiteId())){
			throw new ShfException(new ActionError("shf.error.missingSite"));
		}
		
		validateSplitShift(day);
		
		String moked=SHFTableUtils.getUnitCodeOfSite(day.getSiteId());
		int length=SHFUtils.getMinutesBetween(day.getShiftStart(), day.getShiftEnd());
		if (day.isShiftSplit()) {
			length = day.getSplitShiftLength();
		}
		if(GenericValidator.isBlankOrNull(moked)){
			throw new ShfException(new ActionError("shf.error.missingSite"));
		}
		int minLength=Integer.parseInt(SHFParameters.getMinimalShiftDuration(moked).getValue());
		if(minLength>length){
			throw new ShfException(new ActionError("shf.error.lowShiftDuration"));
		}
		int maxLength=Integer.parseInt(SHFParameters.getMaximalShiftDuration(moked).getValue());
		if(maxLength<length){
			throw new ShfException(new ActionError("shf.error.highShiftDuration"));
		}
		if(GenericValidator.isBlankOrNull(day.getWmActivityId())){
			throw new ShfException(new ActionError("shf.error.missingActivity"));
		}
		if(GenericValidator.isBlankOrNull(day.getEmpIdNumber())){
			throw new ShfException(new ActionError("shf.error.missingIdNumber"));
		}
		//check if this shift is too close to another shift.
		CheckValidDate timeValidator=new CheckValidDate(day);
		
		if (!action.equals("add_extra_shift_all")){
			validateShiftBreaks(breaks,day);
			timeValidator.checkAddedShift();
		}else{
			timeValidator.checkAddedShiftInforce();
		}
			
	}
	private void validateSplitShift(AgentDayBean day) throws ShfException {
		if (day.isShiftSplit()) {
			
			// check if split end before split start
			if (day.getSplitShiftEnd().before(day.getSplitShiftStart())) {
				throw new ShfException(new ActionError("shf.error.splitShiftEndBeforeStart"));
			}
			
			// check split is in shift range
			if ((day.getSplitShiftStart().before(day.getShiftStart()) || day.getSplitShiftStart().after(day.getShiftEnd()))
				|| (day.getSplitShiftEnd().before(day.getShiftStart()) || day.getSplitShiftEnd().after(day.getShiftEnd()))				
			){
				throw new ShfException(new ActionError("shf.error.splitShiftOutOfRange"));
			}
			
			// check first part min duration
			int splitFirstPartMinDuration = 120; // minutes
			if (day.getSplitShiftLengthPart(1) < splitFirstPartMinDuration) {
				throw new ShfException(new ActionError("shf.error.splitShiftFirstPartMinDuration", String.valueOf(splitFirstPartMinDuration)));
			}
			
			// check split min duration
			int splitMinDuration = 120; // minutes
			if (day.getSplitDuration() < splitMinDuration) {
				throw new ShfException(new ActionError("shf.error.splitMinDuration", String.valueOf(splitMinDuration)));
			}
			
			// check second part start after 16:00
			Calendar splitSecondPartMinStartTime = Calendar.getInstance();
			splitSecondPartMinStartTime.setTime(day.getShiftStart());
			splitSecondPartMinStartTime.set(Calendar.HOUR_OF_DAY, 16);
			Date minTime = splitSecondPartMinStartTime.getTime();
			if (day.getSplitShiftEnd().before(minTime)) {
				throw new ShfException(new ActionError("shf.error.splitSecondPartMinStartTime", SHFUtils.formatDateToString(minTime, "HH:mm")));				
			}
		}
	}
	
	private static void validateShiftBreaks(Vector<BreakBean> breaks,AgentDayBean day) throws ShfException{
		for(int i=0;i<breaks.size();i++){
			BreakBean breakBean=breaks.get(i);
			if(breakBean.getStartTime().after(breakBean.getEndTime())){
				throw new ShfException(new ActionError("shf.error.breakEndBeforeStart"));
			}
			BreakDataModel.checkValidBreakRangeWithShift(day.getShiftStart(),day.getShiftEnd(),breakBean.getStartTime(),breakBean.getDuration(),0,false);
			
			if (day.isShiftSplit()) {	// check if break start or end in split range
				if ( ! (breakBean.getStartTime().before(day.getSplitStart()) || breakBean.getStartTime().after(day.getSplitEnd()))
					|| ! (breakBean.getEndTime().before(day.getSplitStart()) || breakBean.getEndTime().after(day.getSplitEnd()))
				) {
					throw new ShfException(new ActionError("shf.error.breakInSplitShiftRange"));
				}
			}
		}
		int allowedRange=SHFConstants.MIN_RANGE_BETWEEN_BREAKS;
		for(int i=0;i<breaks.size()-1;i++){
			BreakBean b1=breaks.get(i);
			BreakBean b2=breaks.get(i+1);
			BreakDataModel.checkBreakRange(b1.getStartTime(),b1.getDuration(),b2.getStartTime(),b2.getDuration(),allowedRange);
		}
	}
	
	public void addSingleShift(String action) throws ShfException{
		logger.info("begin adding extra shift by "+addShiftForm.getUserId()+" for employee "+addShiftForm.getEmployeeId());
		logger.info("date="+addShiftForm.getDate()+"  from="+addShiftForm.getShiftStart()+"  to="+addShiftForm.getShiftEnd());
		logger.info("activity="+addShiftForm.getActivity()+"  remark="+addShiftForm.getRemark());
		for(int i=0;i<addShiftForm.getBreaksNumber();i++){
			logger.info("break"+ (i+1) +"= "+addShiftForm.getBreakStart()[i]+" - "+addShiftForm.getBreakEnd()[i]);
		}
		
		AgentDayBean agentDayBean=new AgentDayBean();
		Vector<BreakBean> breaks=new Vector<BreakBean>();
		Date start=null;
		Date end=null;
		try{
			start=BaseConvert.stringToDate(addShiftForm.getDate()+" "+addShiftForm.getShiftStart(),"dd/MM/yyyy HH:mm");
			end=BaseConvert.stringToDate(addShiftForm.getDate()+" "+addShiftForm.getShiftEnd(),"dd/MM/yyyy HH:mm");
			if(end.before(start)){
				end.setTime(end.getTime()+ (60*60*24*1000));
			}
			long agentDayId=DBResource.getNextSequence("SHIFTER.SHF_AGENT_DAY_ID");
			agentDayBean.setAgentDayId(agentDayId);
			agentDayBean.setWmShiftStartTime(start);
			agentDayBean.setWmShiftEndTime(end);
			agentDayBean.setWmActivityId(addShiftForm.getActivity());
			agentDayBean.setDate(start);
			agentDayBean.setWmDayType(SHFConstants.DAY_TYPE_ACTIVITY);
			agentDayBean.setWmSiteId(SHFTableUtils.getSiteCodeOfUnit(addShiftForm.getMoked()));
			agentDayBean.setWmPaidMinutes(SHFUtils.getMinutesBetween(start, end));
			agentDayBean.setWmEmpIdNumber(addShiftForm.getIdNumber());
			agentDayBean.setShiftSource(SHFConstants.EXTRA_SHIFT_SOURCE);
			agentDayBean.setWmDayStart(start);
			agentDayBean.setWmDayEnd(end);
			agentDayBean.setRemark(addShiftForm.getRemark());
			agentDayBean.setWorkFromHome(SHFConstants.SHIFT_LOCATION_HOME.equals(addShiftForm.getShiftLocation()) ? "Y" : "N");
			agentDayBean.setSplitShift("N");
			if (addShiftForm.isShiftSplit()) {
				agentDayBean.setSplitShift("Y");
				agentDayBean.setSplitStart(BaseConvert.stringToDate(addShiftForm.getDate()+" "+addShiftForm.getShiftSplitStart(),"dd/MM/yyyy HH:mm"));
				agentDayBean.setSplitEnd(BaseConvert.stringToDate(addShiftForm.getDate()+" "+addShiftForm.getShiftSplitEnd(),"dd/MM/yyyy HH:mm"));
			}
			Date now=new Date();
			int workMinutes=agentDayBean.getPaidMinutes();
			for(int i=0;i<addShiftForm.getBreaksNumber();i++){
				BreakBean breakBean=new BreakBean();
				breakBean.setAgentDayId(agentDayId);
				Date breakStart=BaseConvert.stringToDate(addShiftForm.getDate()+" "+addShiftForm.getBreakStart()[i],"dd/MM/yyyy HH:mm");
				Date breakEnd=BaseConvert.stringToDate(addShiftForm.getDate()+" "+addShiftForm.getBreakEnd()[i],"dd/MM/yyyy HH:mm");
				
				if(breakStart.before(start)){
					breakStart.setTime(breakStart.getTime()+ (60*60*24*1000));
				}
				if(breakEnd.before(start)){
					breakEnd.setTime(breakEnd.getTime()+ (60*60*24*1000));
				}
				breakBean.setStartTime(breakStart);
				breakBean.setEndTime(breakEnd);
				int len=SHFUtils.getMinutesBetween(breakStart, breakEnd);
				breakBean.setDuration(len);
				//reducing breaks length from all paid minutes to get working minutes - neto.
				workMinutes-=len;
				
				breakBean.setStateType(SHFConstants.STATE_BREAK);
				breakBean.setExceptionType("0");
				breakBean.setSource("SHF");
				breakBean.setModificationTime(now);
				breakBean.setModificationUser(addShiftForm.getUserFirstName()+" "+addShiftForm.getUserLastName());
				breaks.add(breakBean);
			}
			agentDayBean.setWmWorkMinutes(workMinutes);
			validate_addShift(agentDayBean,breaks,action);
			
		}catch (ShfException e) {
			logger.error(e.getMessage());
			throw e;
		}catch (Exception e) {
			logger.error(e.getMessage());
			e.printStackTrace();
			throw new ShfException(new ActionError("shf.error.general"));
		}
		
		///////
		
		DBAccess db=null;
		try{
			db=new DBAccess(false);
			insertShift(db,agentDayBean);
			insertBreaks(db,breaks);
//			db.commit();	// Managed breaks, commit only if breaks were successfully synchronized with SoftPhone
		}catch (Exception e) {
			
		}finally{
//			try{
//				db.close();
//			}catch(DBException e){
//				logger.error("error at addSingleShift() while closing db connection: "+e.getMessage());
//				ActionErrors actionErrors = new ActionErrors();
//				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
//				throw new ShfException(actionErrors);
//			}
		}
		
		
		// 8.2016 Managed breaks (after add shift, send new breaks to SoftPhone, if failed abort new shift)

		EmployeeDataForm empForm = new EmployeeDataForm();
		empForm.setEmployeeId(addShiftForm.getEmployeeId());
		EmployeeDataModel empModel = new EmployeeDataModel(empForm);
		empModel.populate();
		
		boolean isManagedBreaks = Boolean.parseBoolean(bzq.shf.utils.SHFParameters.getManagedBreakEnabled(SHFTableUtils.getMokedCodeOf(empForm.getOrgUnitId())).getValue());
		
		if (isManagedBreaks && addShiftForm.isSend()) {	// addShiftForm.isSend => disable send breaks if adding shifts from file
			
			bzq.shfsp.request.ObjectFactory of = new bzq.shfsp.request.ObjectFactory();
			SHFSPBreaks breakObject = of.createSHFSPBreaks();
			List<BreakInfo> breakInfoList = breakObject.getBreakInfo();
			
			breakObject.setActionId(SHFConstants.SHF_SP_ACTION_ID_BREAK_UPDATE);
			SHFUtils.setSHFSPMessageDefaults(breakObject);
			breakObject.setUserId(addShiftForm.getUserId());
			
			for(BreakBean breakBean : breaks){	// prepare breaks for insert
				BreakInfo breakInfoIns = of.createSHFSPBreaksBreakInfo();
				breakInfoIns.setMode("I");
				breakInfoIns.setEmployeeId(empForm.getIdNumber());
				breakInfoIns.setAgentDayId(agentDayBean.getAgentDayId());
				breakInfoIns.setStartDatePlanned(BaseConvert.dateToString(breakBean.getStartTime(), "yyyyMMddHHmmss"));
				breakInfoIns.setDuration(breakBean.getDuration());
				
				breakInfoList.add(breakInfoIns);
			}
			
			if (breakObject.getBreakInfo().size() > 0) {	// changes exist -> send message to SoftPhone
				
				// convert to xml string (initial)
				String xmlStringMsg = null;
				try {
					xmlStringMsg = SHFUtils.objToXmlString(breakObject, SHFConstants.SHF_SP_JAXB_REQUEST_CONTEXT);
				} catch (JAXBException e) {
					logger.error("Error while creating XML string for sending message : " + e.getMessage());
				}
				
				BreakDataModel breakModel = new BreakDataModel();
				
				// insert to transactions table and get transaction ID
				TransactionBean transBean = breakModel.getTransBeanBase(SHFConstants.SHF_SP_PROCESS_ID_DEL_SHIFT, SHFConstants.SHF_SP_SOURCE, SHFConstants.SHF_SP_DESTINATION, addShiftForm.getUserId(), xmlStringMsg);
				
				breakModel.createMessageTransaction(transBean);
				
				breakObject.setTransactionId(String.valueOf(transBean.getId()));
				
				// convert to xml string (final)
				try {
					xmlStringMsg = SHFUtils.objToXmlString(breakObject, SHFConstants.SHF_SP_JAXB_REQUEST_CONTEXT);
					logger.info("xmlString : "+xmlStringMsg);
				} catch (JAXBException e) {
					logger.error("Error while creating XML string for sending message : " + e.getMessage());
				}
				
				// send Tibco message
				if (xmlStringMsg != null && transBean.getId() != 0) {
					try {
						logger.info("Attempting to send message to tibco queue ...");
						breakModel.sendTibcoQueueMsg(SHFConstants.SHF_SP_ATTRIBUTE_VALUE, sCtx, xmlStringMsg);
					} catch (XPathExpressionException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					} catch (IllegalArgumentException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					} catch (NamingException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					} catch (JMSException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					}
					
					//check for reply: either no reply, reply with error or success. If no reply or no success then revert changes at shifter side.
					logger.info("Checking response for transactiod id : " + transBean.getId());
					
					Vector<Long> tmpVec = new Vector<Long>();
					tmpVec.add(transBean.getId());
					Vector<TransactionBean> response = null;
					boolean success = false;
					
					try {
						response = breakModel.checkMessageResponse(tmpVec);
						
						if(response.size() > 0) {
							TransactionBean respBean = response.get(0);
							logger.info("Response message found in DB");
							if(respBean.getXmlResponse() != null && SHFConstants.SHF_SP_RESPONSE_SUCCESS_CODE == respBean.getStatus() && respBean.getStatusDescription() == null){
								success = true;
								logger.info("Message contains SUCCESS status !");
							}
						}
						
					} catch (Exception e) {
						logger.error("Exception thrown while checking for response, thus proceeding as failed response... ", e);
						
					}
					if ( ! success) {
						
						// Failed to update SoftPhone, revert changes
						logger.info("Sync with SoftPhone failed, attempting to revert changes ... ");
						
						try {
							logger.info("Attempting DB rollback ... ");
							db.rollback();
						} catch (DBException e) {
							logger.error("Error while rollback : " + e.getMessage());
							ActionErrors actionErrors = new ActionErrors();
							actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
							throw new ShfException(actionErrors);
						} finally {
							try {
								db.close();
							} catch (DBException e) {
								logger.error("Error while closing db connection: "+e.getMessage());
								ActionErrors actionErrors = new ActionErrors();
								actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
								throw new ShfException(actionErrors);
							}
						}
						logger.info("Changes reverted successfully !");
						ActionErrors actionErrors = new ActionErrors();
						actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.shfsp_sync_failed"));
						throw new ShfException(actionErrors);
						
					} else {
						logger.info("Sync with SoftPhone complete, all changes applied successfully");
					}
				}
			}
		}	// END IF isManagedBreaks
		
		try {
			db.commit();
		} catch (DBException e) {
			logger.error("Error while commit : " + e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally {
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error while closing db connection: "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		
	}	// END Method addSingleShift()
	
	private void insertShift(DBAccess db,AgentDayBean agentDayBean) throws DBException{
		int param=1;
		StringBuffer sql=new StringBuffer();
		sql.append("INSERT INTO SHIFTER.SHF_EMPLOYEE_DAY d (");
		sql.append("d.SHF_EMPLOYEE_DAY_ID,");		// 1
		sql.append("d.WM_DATE,");					// 2
		sql.append("d.WM_DAY_TYPE,");				// 3
		sql.append("d.EMP_ID_NUMBER,");				// 4
		sql.append("d.SOURCE,");					// 5
		sql.append("d.WM_SCH_ACTIVITY_ID_DATA,");	// 6	
		sql.append("d.WM_START_DATETIME,");			// 7
		sql.append("d.WM_END_DATETIME,");			// 8
		sql.append("d.WM_SHIFT_START_DATETIME,");	// 9
		sql.append("d.WM_SHIFT_END_DATETIME,");		// 10
		sql.append("d.WM_SITE_ID,");				// 11
		sql.append("d.WM_WORK_MINUTES,");			// 12
		sql.append("d.WM_PAID_MINUTES,");			// 13
		sql.append("d.REMARK, ");					// 14
		sql.append("d.WORK_FROM_HOME, ");			// 15
		sql.append("d.SPLIT_SHIFT ");				// 16
		
		if (agentDayBean.isShiftSplit()) {
			sql.append(", d.SPLIT_START, d.SPLIT_END)");		// 17, 18
		} else {
			sql.append(") ");
		}
		
		sql.append("values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?"); 	//1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16
		
		if (agentDayBean.isShiftSplit()) {
			sql.append(",?,?) ");		// 17, 18
		} else {
			sql.append(") ");
		}
		
		db.prepareStatement(sql.toString());
		db.setLong(param++, agentDayBean.getAgentDayId());		// 1
		db.setDate(param++, agentDayBean.getDate());			// 2
		db.setInt(param++, agentDayBean.getDayType());			// 3
		db.setString(param++, agentDayBean.getEmpIdNumber());	// 4
		db.setString(param++, agentDayBean.getShiftSource());	// 5
		db.setString(param++, agentDayBean.getWmActivityId());	// 6
		db.setTimestamp(param++, agentDayBean.getShiftStart());	// 7
		db.setTimestamp(param++, agentDayBean.getShiftEnd());	// 8
		db.setTimestamp(param++, agentDayBean.getShiftStart());	// 9
		db.setTimestamp(param++, agentDayBean.getShiftEnd());	// 10
		db.setString(param++, agentDayBean.getSiteId());		// 11
		db.setInt(param++, agentDayBean.getWmWorkMinutes());	// 12
		db.setInt(param++, agentDayBean.getWmPaidMinutes());	// 13
		db.setString(param++, agentDayBean.getRemark());		// 14
		db.setString(param++, agentDayBean.getWorkFromHome());	// 15
		db.setString(param++, agentDayBean.getSplitShift());	// 16
		
		if (agentDayBean.isShiftSplit()) {
			db.setTimestamp(param++, agentDayBean.getSplitShiftStart());	// 17
			db.setTimestamp(param++, agentDayBean.getSplitShiftEnd());	// 18
		}
		
		db.executeUpdate();
	}
	
	private void insertBreaks(DBAccess db,Vector<BreakBean> breaks) throws DBException{
		for(int i=0;i<breaks.size();i++){
			BreakDataModel.addBreak(db, breaks.get(i));
		}
	}
	
	private void delShift (DBAccess db, AgentDayBean dayBean) throws DBException {
		logger.debug("Starting delShift()");
		
		if(db == null || dayBean == null){
			throw new IllegalArgumentException("Illegal arguments were specified ");
		}
		
		int param = 1;
		
		StringBuffer sql = new StringBuffer();
		sql.append("DELETE FROM shifter.shf_employee_day t ");
		sql.append("WHERE t.shf_employee_day_id = ?");
		
		db.prepareStatement(sql.toString());
		
		db.setLong(param++, dayBean.getAgentDayId());
		
		db.executeUpdate();
		
	}
	
	private void delBreaks (DBAccess db, AgentDayBean dayBean) throws DBException {
		logger.debug("Starting delBreaks()");
		
		if(db == null || dayBean == null){
			throw new IllegalArgumentException("Illegal arguments were specified ");
		}
		
		int param = 1;
		
		StringBuffer sql = new StringBuffer();
		sql.append("DELETE FROM shifter.shf_employee_exceptions t ");
		sql.append("WHERE t.agent_day_id = ?");
		
		db.prepareStatement(sql.toString());
		
		db.setLong(param++, dayBean.getAgentDayId());
		
		db.executeUpdate();
		
	}
	
	public void setAddSingleShiftDefaults() throws ShfException{
		Date date=new Date();
		String start=BaseConvert.dateToString(date, "HH");
		addShiftForm.setShiftStart(start+":00");
		addShiftForm.setShiftEnd(start+":00");
		Calendar cal=Calendar.getInstance();
		cal.setTime(date);
		cal.add(Calendar.HOUR_OF_DAY, 1);
		date=cal.getTime();
		String breakStart=BaseConvert.dateToString(date, "HH");
		addShiftForm.setBreakStart(new String[]{breakStart+":00"});
		addShiftForm.setBreakEnd(new String[]{breakStart+":30"});
		
		EmployeeDataForm employeeDataForm=new EmployeeDataForm();
		employeeDataForm.setUserFirstName(addShiftForm.getUserFirstName());
		employeeDataForm.setUserLastName(addShiftForm.getUserLastName());
		employeeDataForm.setUserId(addShiftForm.getUserId());
		employeeDataForm.setEmployeeId(addShiftForm.getEmployeeId());
		EmployeeDataModel employee=new EmployeeDataModel(employeeDataForm);
		employee.populate();
		addShiftForm.setMoked(SHFTableUtils.getMokedCodeOf(employeeDataForm.getOrgUnitId()));
		addShiftForm.setIdNumber(employeeDataForm.getIdNumber().substring(0,8));
	}
	public EmployeeInforceListForm getPotentialInforce() throws ShfException{

			logger.debug("Starting populateEployeeInforce()");
			EmployeeInforceListForm empInforce = new EmployeeInforceListForm();
			int param_index=1;
			String shiftRange="0";
			Date shiftStart=null,shiftEnd=null;
			shiftRange=SHFParameters.getMinHoursBetweenShifts(shiftInforce.getMoked()).getValue();
			String dateStr=BaseConvert.dateToString(shiftInforce.getDate(), "dd/MM/yyyy");
			String startStr=BaseConvert.dateToString(shiftInforce.getShiftStart(), "HH:mm");
			String endStr=BaseConvert.dateToString(shiftInforce.getShiftEnd(), "HH:mm");
			try {
				shiftStart=BaseConvert.stringToDate(dateStr+" "+startStr, "dd/MM/yyyy HH:mm");
				shiftEnd=BaseConvert.stringToDate(dateStr+" "+endStr, "dd/MM/yyyy HH:mm");
			} catch (ConvertException e1) {
				logger.error(e1.getMessage());
				throw new ShfException(new ActionError("shf.error.general"));
			}
			StringBuffer sql=new StringBuffer();	
			
			sql.append("select distinct e.EMPLOYEE_ID EMPLOYEE_ID, e.EMP_ID_NUMBER EMP_ID_NUMBER,e.FIRST_NAME FIRST_NAME, e.LAST_NAME LAST_NAME,e.ORG_UNIT_ID ORG_UNIT_ID, e.JOB_TIME JOB_TIME ");
			sql.append("from shifter.shf_employees e  ");
			sql.append("left join shifter.shf_org_unit u on u.org_unit_id=e.org_unit_id ");
			sql.append("where (u.parent_unit=? or u.org_unit_id=?) ");
			sql.append("and e.employee_id>0 ");
			DBAccess dBAccess=null;
			try {
				dBAccess=new DBAccess();
				
				dBAccess.prepareStatement(sql.toString());
				dBAccess.setString(param_index++, shiftInforce.getMoked());
				dBAccess.setString(param_index++, shiftInforce.getMoked());
				
				dBAccess.executeQuery();
				
				Vector<EmployeeBean> employees=new Vector<EmployeeBean>();
				EmployeeBean employeeInfo=null;

				while(dBAccess.next()){
					employeeInfo=new EmployeeBean();
					dBAccess.populate(employeeInfo);
					employees.add(employeeInfo);
				}
				if(!employees.isEmpty())
					empInforce.setEmployee((EmployeeBean[])employees.toArray(new EmployeeBean[employees.size()]));	
				
			} catch (DBQueryNoRowsException e){
				
			} catch (DBException e) {
				logger.error("error in getPotentialInforce(): "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			} finally{
				try {
					dBAccess.close();
				} catch (DBException e) {
					logger.error("error in getPotentialInforce() while closing db connection : "+e.getMessage());
					ActionErrors actionErrors=new ActionErrors();
					actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
					throw new ShfException(actionErrors);
				}
			}
			return empInforce;
	}
	
	public Vector getUserPotentailForInforce() throws ShfException{
		Vector employeesPotential=null;
		Vector employee = null;
		Vector potential = new Vector();
		AgentDayBean agentDayBean = null;
		EmployeeBean employeeBean = null;
		Date startRange = null;
		Date endRange = null;
		PotentialEmployeeBean potentialEmpBeans = null;
		
		
		String dateStr=BaseConvert.dateToString(potentialInforceForm.getDate(), "dd/MM/yyyy");
		String startStr=BaseConvert.dateToString(potentialInforceForm.getStartPotential(), "HH:mm");
		String endStr=BaseConvert.dateToString(potentialInforceForm.getEndPotential(), "HH:mm");
		try {
			startRange=BaseConvert.stringToDate(dateStr+" "+startStr, "dd/MM/yyyy HH:mm");
			endRange=BaseConvert.stringToDate(dateStr+" "+endStr, "dd/MM/yyyy HH:mm");
		} catch (ConvertException e1) {
			logger.error(e1.getMessage());
			throw new ShfException(new ActionError("shf.error.general"));
		}
		
		potentialInforceForm.setStartPotentialDT(startRange);
		potentialInforceForm.setEndPotentialDT(endRange);
		//tamar
		
		//try {
		//potentialInforceForm.setStartTimeInforce(BaseConvert.stringToDate(startStr, "HH:mm"));
		//potentialInforceForm.setEndTimeInforce(BaseConvert.stringToDate(endStr, "HH:mm"));
		//} catch (ConvertException e1) {
		//	logger.error(e1.getMessage());
		//	throw new ShfException(new ActionError("shf.error.general"));
		//}
		
		//tamar
		Integer maxLength=Integer.parseInt(SHFParameters.getMaximalShiftDuration(potentialInforceForm.getMoked()).getValue());
		potentialInforceForm.setMaxLength(maxLength);
		employee = getEmployeeToCheckPotential();
		employeesPotential = getShiftToCheckPotentail();
		getTimeOffShiftToCheckPotentail(employeesPotential);
		HashMap timeRangeMaster = null;
		timeRangeMaster = getTimeRangeHM();
		
		
		HashMap usersPotentialHm = new HashMap();
		for (int h=0; h<employee.size();h++) {
			//loop for all employee for selection
			employeeBean = new EmployeeBean();
			employeeBean = (EmployeeBean)employee.get(h);
			HashMap timeRange = new HashMap();

			timeRange.putAll(timeRangeMaster); //get all the time range as avilable time
			// build HM of avilble time range for user
			usersPotentialHm.put(employeeBean.getEmployeeId(), timeRange); 
			for (int i=0; i<employeesPotential.size();i++) {
				//loop for all the shifts of the employees
				agentDayBean = new AgentDayBean();
				agentDayBean = (AgentDayBean)employeesPotential.get(i);
				boolean check = true;
				if (employeeBean.getEmployeeId() == agentDayBean.getEmployeeId() ) {
					//check for the shifts of current employee
					Calendar cal = Calendar.getInstance();
					Calendar calT = Calendar.getInstance();
					Calendar calShiftStart = Calendar.getInstance();
					Calendar calShiftEnd = Calendar.getInstance();
					
					String shiftRangeFromStart=SHFParameters.getMinimumTimeFromLastSHift(potentialInforceForm.getMoked()).getValue();
					String shiftRangeFromEnd = SHFParameters.getMinimumTimeFromNextSHift(potentialInforceForm.getMoked()).getValue();
					
					if (agentDayBean.getShiftStart() != null) { //For time off (doesnt have time)
					//calculate the minimal start time range to check overlap with other shifts
					calShiftStart.setTime(agentDayBean.getShiftStart());
					calShiftStart.add(Calendar.HOUR_OF_DAY, 0-(Integer.parseInt(shiftRangeFromStart)/60));
					}
					if (agentDayBean.getShiftEnd() != null) { //For time off (doesnt have time)
					//calculate the maximal end time range to check overlap with other shifts
					calShiftEnd.setTime(agentDayBean.getShiftEnd());
					calShiftEnd.add(Calendar.HOUR_OF_DAY, (Integer.parseInt(shiftRangeFromEnd)/60));
					}
					Vector time = new Vector();
					
					HashMap tempHM = new HashMap();
					tempHM = (HashMap)usersPotentialHm.get(employeeBean.getEmployeeId());
					for (cal.setTime(potentialInforceForm.getStartPotentialDT()); cal.getTime().getTime() <= potentialInforceForm.getEndPotentialDT().getTime(); cal.add(Calendar.HOUR_OF_DAY, 1)) {
						//loop for all the hours to check if potential is positive
						calT.setTime(cal.getTime());
						calT.add(Calendar.HOUR_OF_DAY, 1);
						//check for every hour in range time if available 
						if (agentDayBean.getWmDayType() == SHFConstants.DAY_TYPE_ACTIVITY) {
							check=checkRangeForInforce(cal.getTime().getTime(), calT.getTime().getTime(), calShiftStart.getTime().getTime(), calShiftEnd.getTime().getTime());
						}
						else {
							//TIME OFF
							check = false;
						}
						if (check) {
							time.add(cal.getTime());
						} else {
							//if not avilable change value to - 0
							tempHM.put(BaseConvert.dateToString(cal.getTime(), "HH:mm"), new Integer(0));
						}
					}
					usersPotentialHm.put(employeeBean.getEmployeeId(), tempHM);
					int ii=0;
				}
			}
			// continue to build bean for evry range in the HM
			HashMap tempHM = new HashMap();
			tempHM = (HashMap)usersPotentialHm.get(employeeBean.getEmployeeId());
			Calendar calRange = Calendar.getInstance();
			boolean range = false;
			boolean lastRange = false;
			potentialEmpBeans = new PotentialEmployeeBean();
			for (calRange.setTime(potentialInforceForm.getStartPotentialDT());
					calRange.getTime().getTime() < potentialInforceForm.getEndPotentialDT().getTime();
					calRange.add(Calendar.HOUR_OF_DAY, 1)) {
				if (tempHM.get(BaseConvert.dateToString(calRange.getTime(), "HH:mm")).equals(new Integer(1))) {
					range = true;
				} else {
					range = false;
				}
				if (range && !lastRange) {
					//get a START of an avilable range 
					potentialEmpBeans.setStart_Potential(calRange.getTime());
					potentialEmpBeans.setChecked("");
				}
				if (!range && lastRange) {
					//get an END  of an avilable range
					potentialEmpBeans.setEnd_Potential(calRange.getTime());
					potentialEmpBeans.setEmployeeBean(employeeBean);
					potentialEmpBeans.setChecked("");
					potential.add(potentialEmpBeans);
					potentialEmpBeans = new PotentialEmployeeBean();
				}
				
				lastRange = range;
			}
			if (range) {
				//in this case the last hour in the range is avilable, so it is the END of the range
				calRange.setTime(endRange);
				potentialEmpBeans.setEnd_Potential(calRange.getTime());
				potentialEmpBeans.setEmployeeBean(employeeBean);
				potentialEmpBeans.setChecked("");
				potential.add(potentialEmpBeans);
				potentialEmpBeans = new PotentialEmployeeBean();
			}
			
		}//End Employee
		return potential;
		
		
	}
	
	private void getTimeOffShiftToCheckPotentail(Vector employeesPotential) throws ShfException{
		logger.debug("Starting getTimeOffShiftToCheckPotentail()");
		
		int param_index=1;
		String shiftRangeFromStart="0";
		String shiftRangeFromEnd="0";
		Date startRangeMinusDay=null,endRangePlusDay=null;
		shiftRangeFromStart=SHFParameters.getMinimumTimeFromLastSHift(potentialInforceForm.getMoked()).getValue();
		shiftRangeFromEnd = SHFParameters.getMinimumTimeFromNextSHift(potentialInforceForm.getMoked()).getValue();
		
		StringBuffer sql=new StringBuffer();	
		
		sql.append(" SELECT E.*, D.*, C.* ");
		sql.append(" FROM SHIFTER.SHF_EMPLOYEE_DAY D LEFT JOIN SHIFTER.SHF_DAY_CHANGES C ON C.SHF_EMPLOYEE_DAY_ID=D.SHF_EMPLOYEE_DAY_ID ");
		sql.append("      LEFT JOIN SHIFTER.SHF_EMPLOYEES E ON SUBSTR(E.EMP_ID_NUMBER,1,8)=NVL(C.NEW_EMPLOYEE_ID,D.EMP_ID_NUMBER)  ");
		sql.append("      LEFT JOIN SHIFTER.SHF_CATEGORY_JOB T ON  T.JOB_ID = E.Job_Id ");
		sql.append("      LEFT JOIN SHIFTER.SHF_ORG_UNIT U ON U.ORG_UNIT_ID=E.ORG_UNIT_ID ");
		sql.append(" WHERE E.EMPLOYEE_ID>0  ");
		sql.append("   AND C.CANCEL_REASON_CODE IS NULL  ");
		sql.append("   AND NVL(c.NEW_DAY_TYPE,d.WM_DAY_TYPE)=? "); //1
		sql.append("      AND D.WM_DATE = ? "); //2
		sql.append("   AND E.STATUS_ID = ? "); //3
		if (potentialInforceForm.isTrained()) {
			sql.append(" AND E.TRAINED = ? "); //4
		}
		if (potentialInforceForm.isWorkFromHome() ) {
			sql.append("   AND E.WORK_FROM_HOME = ? "); //5
		} 
		if (!potentialInforceForm.isCategoryJob()) {
			sql.append(" AND T.CATEGORY_ID = ? "); //6
		}
		if (potentialInforceForm.getFirstName() != null && !potentialInforceForm.getFirstName().equals("") ) {
			sql.append(" AND E.FIRST_NAME LIKE ?||'%' "); //7
		}
		if (potentialInforceForm.getLastName() != null && !potentialInforceForm.getLastName().equals("")) {
			sql.append(" AND E.LAST_NAME LIKE ?||'%' "); //8
		}
		if(potentialInforceForm.getMoked()!=null && !potentialInforceForm.getMoked().equals("-1")){
			if(potentialInforceForm.getTeam()!=null && !potentialInforceForm.getTeam()[0].equals("00")){
				
				sql.append("AND E.ORG_UNIT_ID IN ( ");
				String[] array = potentialInforceForm.getTeam();
				for(int i=0;i<array.length;i++){
					sql.append(array[i]);
					if(i<array.length-1) sql.append(",");
				}
				sql.append(")");
				
			}else{
				sql.append("AND (U.PARENT_UNIT = ?  or  u.org_unit_id= ? )"); //9
			}
		}else{
			StringBuffer unitSelect = new StringBuffer("");
			unitSelect.append("AND (U.PARENT_UNIT IN (" );
			Vector allowedUnits = potentialInforceForm.getAllowedUnits();
			Iterator  it = allowedUnits.iterator();
			while (it.hasNext()) {
				unitSelect.append( it.next()); 
				if (it.hasNext()) 
				unitSelect.append(","); 
			} 
			//TAMAR
			unitSelect.append(" )  OR U.ORG_UNIT_ID IN (");
			it = allowedUnits.iterator();
			while (it.hasNext()) {
				unitSelect.append( it.next()); 
				if (it.hasNext()) 
				unitSelect.append(","); 
			} 
		
			unitSelect.append(" ))");
			//tamar
			//unitSelect.append(" )");
			sql.append(unitSelect);
		}
		
		
		if(potentialInforceForm.getInnerJob()!=null && !potentialInforceForm.getInnerJob()[0].equals("00")){
			sql.append("AND E.INNER_JOB_ID IN ( ");
			String[] array = potentialInforceForm.getInnerJob();
			for(int i=0;i<array.length;i++){
				sql.append(array[i]);
				if(i<array.length-1) sql.append(",");
			}
			sql.append(")");
			
		}
	
		sql.append(" ORDER BY E.EMP_ID_NUMBER, (NVL(C.NEW_SHIFT_START,D.WM_SHIFT_START_DATETIME))");
		
		
		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			
			dBAccess.prepareStatement(sql.toString());
			dBAccess.setInt(param_index++,SHFConstants.DAY_TYPE_TIMEOFF); //1
			dBAccess.setTimestamp(param_index++, potentialInforceForm.getStartPotentialDT()); //2
			dBAccess.setInt(param_index++, SHFConstants.EMPLOYEE_STATUS_ACTIVE); //3
			if (potentialInforceForm.isTrained() ) {
				dBAccess.setString(param_index++, "1"); //4
			}
			if (potentialInforceForm.isWorkFromHome() ) {
				dBAccess.setString(param_index++, "1"); //5
			}
			if (!potentialInforceForm.isCategoryJob()) {
				dBAccess.setInt(param_index++, 1 ); //6
			}
			if (potentialInforceForm.getFirstName() != null && !potentialInforceForm.getFirstName().equals("") ) {
				dBAccess.setString(param_index++, potentialInforceForm.getFirstName()); //7
			}
			if (potentialInforceForm.getLastName() != null && !potentialInforceForm.getLastName().equals("")) {
				dBAccess.setString(param_index++, potentialInforceForm.getLastName()); //8
			}
			if(potentialInforceForm.getMoked()!=null && !potentialInforceForm.getMoked().equals("-1")){
				if(potentialInforceForm.getTeam()!=null && !potentialInforceForm.getTeam()[0].equals("00")){
					//db.setString(param_index++,((ShiftDataForm)shiftForm).getTeam());	
				}else{
					dBAccess.setString(param_index++,potentialInforceForm.getMoked()); //9
					dBAccess.setString(param_index++,potentialInforceForm.getMoked()); //10
				}
				
			}
			
			dBAccess.executeQuery();
			
			
//			dBAccess.populate("bzq.shf.bean.AgentDayBean", employeesPotential);
			
			
			AgentDayBean potentialInfo=null;

			while(dBAccess.next()){
				potentialInfo=new AgentDayBean();
				dBAccess.populate(potentialInfo);
				employeesPotential.add(potentialInfo);
			}

		} catch (DBQueryNoRowsException e){
			
		} catch (DBException e) {
			logger.error("error in getTimeOffShiftToCheckPotentail(): "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				logger.error("error in getTimeOffShiftToCheckPotentail() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}
	private HashMap getTimeRangeHM() {
		//get all the time range with value 1, means that the time is avilable (0 time is not avilable)
		HashMap timeRange = new HashMap();
		Calendar cal = Calendar.getInstance();
		for (cal.setTime(potentialInforceForm.getStartPotentialDT()); cal.getTime().getTime() <= potentialInforceForm.getEndPotentialDT().getTime(); cal.add(Calendar.HOUR_OF_DAY, 1)) {
			timeRange.put(BaseConvert.dateToString(cal.getTime(), "HH:mm"), new Integer(1));
		}
		return timeRange;
	}
	private Vector getEmployeeToCheckPotential() throws ShfException{
		logger.debug("Starting getEmployeeToCheckPotential()");
		Vector employeesPotential=new Vector();
		
		int param_index=1;
		
		StringBuffer sql=new StringBuffer();	
		
		sql.append(" SELECT E.* ");
		sql.append(" FROM SHIFTER.SHF_EMPLOYEES E LEFT JOIN SHIFTER.SHF_ORG_UNIT U ON U.ORG_UNIT_ID = E.ORG_UNIT_ID ");
		sql.append("      LEFT JOIN SHIFTER.SHF_CATEGORY_JOB T ON  T.JOB_ID = E.Job_Id ");					
		sql.append(" WHERE E.EMPLOYEE_ID>0  ");
		sql.append("   AND E.STATUS_ID = ? "); //1
		if (potentialInforceForm.isTrained() ) {
			sql.append(" AND E.TRAINED = ? "); //2
		}
		if (potentialInforceForm.isWorkFromHome() ) {
			sql.append("   AND E.WORK_FROM_HOME = ? "); //3
		} 
		if (!potentialInforceForm.isCategoryJob()) {
			sql.append(" AND T.CATEGORY_ID = ? "); //4
		}
		if (potentialInforceForm.getFirstName() != null && !potentialInforceForm.getFirstName().equals("") ) {
			sql.append(" AND E.FIRST_NAME LIKE ?||'%' "); //5
		}
		if (potentialInforceForm.getLastName() != null && !potentialInforceForm.getLastName().equals("")) {
			sql.append(" AND E.LAST_NAME LIKE ?||'%' "); //6
		}
		if(potentialInforceForm.getMoked()!=null && !potentialInforceForm.getMoked().equals("-1")){
			if(potentialInforceForm.getTeam()!=null && !potentialInforceForm.getTeam()[0].equals("00")){
				
				sql.append("AND E.ORG_UNIT_ID IN ( ");
				String[] array = potentialInforceForm.getTeam();
				for(int i=0;i<array.length;i++){
					sql.append(array[i]);
					if(i<array.length-1) sql.append(",");
				}
				sql.append(")");
				
			}else{
				sql.append("AND (U.PARENT_UNIT = ? OR U.ORG_UNIT_ID = ? )  "); //7 8
			}
		}else{
			StringBuffer unitSelect = new StringBuffer("");
			unitSelect.append("AND (U.PARENT_UNIT IN (" );
			Vector allowedUnits = potentialInforceForm.getAllowedUnits();
			Iterator  it = allowedUnits.iterator();
			while (it.hasNext()) {
				unitSelect.append( it.next()); 
				if (it.hasNext()) 
				unitSelect.append(","); 
			} 
			//TAMAR
			unitSelect.append(" )  OR U.ORG_UNIT_ID IN (");
			it = allowedUnits.iterator();
			while (it.hasNext()) {
				unitSelect.append( it.next()); 
				if (it.hasNext()) 
				unitSelect.append(","); 
			} 
		
			unitSelect.append(" ))");
			//tamar
			
			sql.append(unitSelect);
		}
		
		
		if(potentialInforceForm.getInnerJob()!=null && !potentialInforceForm.getInnerJob()[0].equals("00")){
			sql.append("AND E.INNER_JOB_ID IN ( ");
			String[] array = potentialInforceForm.getInnerJob();
			for(int i=0;i<array.length;i++){
				sql.append(array[i]);
				if(i<array.length-1) sql.append(",");
			}
			sql.append(")");
			
		}
		sql.append(" ORDER BY E.EMP_ID_NUMBER ");
		
		
		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			
			dBAccess.prepareStatement(sql.toString());
			dBAccess.setInt(param_index++, SHFConstants.EMPLOYEE_STATUS_ACTIVE); //1
			if (potentialInforceForm.isTrained() ) {
				dBAccess.setString(param_index++, "1"); //2
			}
			if (potentialInforceForm.isWorkFromHome() ) {
				dBAccess.setString(param_index++, "1" ); //3
			}
			if (!potentialInforceForm.isCategoryJob()) {
				dBAccess.setInt(param_index++, 1 ); //4
			}
			if (potentialInforceForm.getFirstName() != null && !potentialInforceForm.getFirstName().equals("") ) {
				dBAccess.setString(param_index++, potentialInforceForm.getFirstName()); //5
			}
			if (potentialInforceForm.getLastName() != null && !potentialInforceForm.getLastName().equals("")) {
				dBAccess.setString(param_index++, potentialInforceForm.getLastName()); //6
			}
			if(potentialInforceForm.getMoked()!=null && !potentialInforceForm.getMoked().equals("-1")){
				if(potentialInforceForm.getTeam()!=null && !potentialInforceForm.getTeam()[0].equals("00")){
					//db.setString(param_index++,((ShiftDataForm)shiftForm).getTeam());	
				}else{
					dBAccess.setString(param_index++,potentialInforceForm.getMoked()); //7
					dBAccess.setString(param_index++,potentialInforceForm.getMoked()); //8
				}
				
			}
			dBAccess.executeQuery();
			
			
			dBAccess.populate("bzq.shf.bean.EmployeeBean", employeesPotential);
			
		} catch (DBQueryNoRowsException e){
			
		} catch (DBException e) {
			logger.error("error in getEmployeeToCheckPotential(): "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				logger.error("error in getEmployeeToCheckPotential() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		return employeesPotential;
	}

	private boolean checkRangeForInforce(long inforceStart, long inforceEnd, long ShiftStart, long ShiftEnd) {
		//חישוב מקטעי פוטנציאל שאינם חופפים עם זמני משמרות
		//inforceStart = start inforce to check
		//inforceEnd = end inforce to check
		//ShiftStart = calculated with minium range before shift
		//ShiftEnd =  calculated with minium range after shift

		long z1=0, z2=0, X1=0, Y1=0, X2=0, Y2=0;
		boolean isOkyLeft = false;
		boolean isOkyRight = false;
		z1 = ShiftStart - inforceStart;
		z2 = inforceEnd - ShiftEnd;
							
		X1 = inforceStart;
		Y1 = X1 + z1;
							
		X2 = ShiftEnd;
		Y2 = X2 + z2; 
		Date Dx1 = new Date();
		Date Dy1 = new Date();
		Date Dx2 = new Date();
		Date Dy2 = new Date();

		Dx1.setTime(X1);
		Dy1.setTime(Y1);
		
		Dx2.setTime(X2);
		Dy2.setTime(Y2);
   	   if (Y1 - X1 > 0) {
   		   //out of range from left
   		   isOkyLeft = true;
			}
	   if (Y2 - X2 > 0) {
   		   //out of range from right
		   isOkyRight = true;
	   }
	   return (isOkyLeft || isOkyRight);
	}
	
	private Vector getShiftToCheckPotentail() throws ShfException{
		logger.debug("Starting getShiftToCheckPotentail()");
		Vector employeesPotential=new Vector();
		
		int param_index=1;
		String shiftRangeFromStart="0";
		String shiftRangeFromEnd="0";
		Date startRangeMinusDay=null,endRangePlusDay=null;
		shiftRangeFromStart=SHFParameters.getMinimumTimeFromLastSHift(potentialInforceForm.getMoked()).getValue();
		shiftRangeFromEnd = SHFParameters.getMinimumTimeFromNextSHift(potentialInforceForm.getMoked()).getValue();
		
		Calendar cal=Calendar.getInstance();
		cal.setTime(potentialInforceForm.getStartPotentialDT());
		cal.add(Calendar.DATE, -1);
		startRangeMinusDay = cal.getTime();

		cal.setTime(potentialInforceForm.getEndPotentialDT());
		cal.add(Calendar.DATE, 1);
		endRangePlusDay = cal.getTime();

		
		StringBuffer sql=new StringBuffer();	
		
		sql.append(" SELECT E.*, D.*, C.* ");
		sql.append(" FROM SHIFTER.SHF_EMPLOYEE_DAY D LEFT JOIN SHIFTER.SHF_DAY_CHANGES C ON C.SHF_EMPLOYEE_DAY_ID=D.SHF_EMPLOYEE_DAY_ID ");
		sql.append("      LEFT JOIN SHIFTER.SHF_EMPLOYEES E ON SUBSTR(E.EMP_ID_NUMBER,1,8)=NVL(C.NEW_EMPLOYEE_ID,D.EMP_ID_NUMBER)  ");
		sql.append("      LEFT JOIN SHIFTER.SHF_CATEGORY_JOB T ON  T.JOB_ID = E.Job_Id ");
		sql.append("      LEFT JOIN SHIFTER.SHF_ORG_UNIT U ON U.ORG_UNIT_ID=E.ORG_UNIT_ID ");
		sql.append(" WHERE E.EMPLOYEE_ID>0  ");
		sql.append("   AND C.CANCEL_REASON_CODE IS NULL  ");
		sql.append("   AND NVL(c.NEW_DAY_TYPE,d.WM_DAY_TYPE)=? "); //1
		sql.append("   AND NVL(C.NEW_SHIFT_START,D.WM_SHIFT_START_DATETIME) > ? "); //2
		sql.append("   AND NVL(C.NEW_SHIFT_START,D.WM_SHIFT_START_DATETIME) < ? "); //3
		sql.append("   AND E.STATUS_ID = ? "); //4
		if (potentialInforceForm.isTrained()) {
			sql.append(" AND E.TRAINED = ? "); //5
		}
		if (potentialInforceForm.isWorkFromHome() ) {
			sql.append("   AND E.WORK_FROM_HOME = ? "); //6
		} 
		if (!potentialInforceForm.isCategoryJob()) {
			sql.append(" AND T.CATEGORY_ID = ? "); //7
		}
		if (potentialInforceForm.getFirstName() != null && !potentialInforceForm.getFirstName().equals("") ) {
			sql.append(" AND E.FIRST_NAME LIKE ?||'%' "); //8
		}
		if (potentialInforceForm.getLastName() != null && !potentialInforceForm.getLastName().equals("")) {
			sql.append(" AND E.LAST_NAME LIKE ?||'%' "); //9
		}
		if(potentialInforceForm.getMoked()!=null && !potentialInforceForm.getMoked().equals("-1")){
			if(potentialInforceForm.getTeam()!=null && !potentialInforceForm.getTeam()[0].equals("00")){
				
				sql.append("AND E.ORG_UNIT_ID IN ( ");
				String[] array = potentialInforceForm.getTeam();
				for(int i=0;i<array.length;i++){
					sql.append(array[i]);
					if(i<array.length-1) sql.append(",");
				}
				sql.append(")");
				
			}else{
				sql.append("AND (U.PARENT_UNIT = ? or u.org_unit_id =? )"); //10 11
			}
		}else{
			StringBuffer unitSelect = new StringBuffer("");
			unitSelect.append("AND (U.PARENT_UNIT IN (" );
			Vector allowedUnits = potentialInforceForm.getAllowedUnits();
			Iterator  it = allowedUnits.iterator();
			while (it.hasNext()) {
				unitSelect.append( it.next()); 
				if (it.hasNext()) 
				unitSelect.append(","); 
			} 
			//TAMAR
			unitSelect.append(" )  OR U.ORG_UNIT_ID IN (");
			it = allowedUnits.iterator();
			while (it.hasNext()) {
				unitSelect.append( it.next()); 
				if (it.hasNext()) 
				unitSelect.append(","); 
			} 
		
			unitSelect.append(" ))");
			//tamar
			//unitSelect.append(" )");
			sql.append(unitSelect);
		}
		
		
		if(potentialInforceForm.getInnerJob()!=null && !potentialInforceForm.getInnerJob()[0].equals("00")){
			sql.append("AND E.INNER_JOB_ID IN ( ");
			String[] array = potentialInforceForm.getInnerJob();
			for(int i=0;i<array.length;i++){
				sql.append(array[i]);
				if(i<array.length-1) sql.append(",");
			}
			sql.append(")");
			
		}
		
		sql.append(" ORDER BY E.EMP_ID_NUMBER, (NVL(C.NEW_SHIFT_START,D.WM_SHIFT_START_DATETIME))");
		
		
		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			
			dBAccess.prepareStatement(sql.toString());
			dBAccess.setInt(param_index++,SHFConstants.DAY_TYPE_ACTIVITY); //1
			dBAccess.setTimestamp(param_index++, startRangeMinusDay); //2
			dBAccess.setTimestamp(param_index++, endRangePlusDay); //3
			dBAccess.setInt(param_index++, SHFConstants.EMPLOYEE_STATUS_ACTIVE); //4
			if (potentialInforceForm.isTrained()) {
				dBAccess.setString(param_index++, "1"); //5
			}
			if (potentialInforceForm.isWorkFromHome() ) {
				dBAccess.setString(param_index++, "1" ); //6
			}
			if (!potentialInforceForm.isCategoryJob()) {
				dBAccess.setInt(param_index++, 1 ); //7
			}
			if (potentialInforceForm.getFirstName() != null && !potentialInforceForm.getFirstName().equals("") ) {
				dBAccess.setString(param_index++, potentialInforceForm.getFirstName()); //8
			}
			if (potentialInforceForm.getLastName() != null && !potentialInforceForm.getLastName().equals("")) {
				dBAccess.setString(param_index++, potentialInforceForm.getLastName()); //9
			}
			if(potentialInforceForm.getMoked()!=null && !potentialInforceForm.getMoked().equals("-1")){
				if(potentialInforceForm.getTeam()!=null && !potentialInforceForm.getTeam()[0].equals("00")){
					//db.setString(param_index++,((ShiftDataForm)shiftForm).getTeam());	
				}else{
					dBAccess.setString(param_index++,potentialInforceForm.getMoked()); //10
					dBAccess.setString(param_index++,potentialInforceForm.getMoked()); //11
				}
				
			}
			
			dBAccess.executeQuery();
			
			
//			dBAccess.populate("bzq.shf.bean.AgentDayBean", employeesPotential);
			
			
			AgentDayBean potentialInfo=null;

			while(dBAccess.next()){
				potentialInfo=new AgentDayBean();
				dBAccess.populate(potentialInfo);
				employeesPotential.add(potentialInfo);
			}

		} catch (DBQueryNoRowsException e){
			
		} catch (DBException e) {
			logger.error("error in getShiftToCheckPotentail(): "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				logger.error("error in getShiftToCheckPotentail() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		return employeesPotential;
	}
	public Vector getSelectedPotential(Vector potentialInforceData)throws ShfException {
		//get only the row the the user checked in the screen
		//calculate the start and the end range for potential inforce
		Vector potentialInforceDataNew = new Vector();
		PotentialEmployeeBean potentialEmployeeBean = new PotentialEmployeeBean();
		EmployeeBean emp = new EmployeeBean();
		StringTokenizer st=null;
		
		potentialInforceForm.getSelectedPotential();
		for (int i=0; i<potentialInforceData.size();i++) {
			potentialEmployeeBean = ((PotentialEmployeeBean)potentialInforceData.get(i));
			emp = potentialEmployeeBean.getEmployeeBean();
			String from_date_vec_str = BaseConvert.dateToString(potentialEmployeeBean.getStart_Potential(), "dd/MM/yyyy HH:mm");
			String emp_id_vev_str = Integer.toString(emp.getEmployeeId());
			boolean checkIfIn = false;
			for (int j=0; j<potentialInforceForm.getSelectedPotential().length;j++) {
				st=new StringTokenizer(potentialInforceForm.getSelectedPotential()[j],";");
				int k=0;
				String from_date_str = null;
				String emp_id_str = null;
				while(st.hasMoreTokens() ){
					if (k==0) { emp_id_str=st.nextToken(); } else {from_date_str=st.nextToken();}
					k++;
				}
				if (emp_id_str.equalsIgnoreCase(emp_id_vev_str) && (from_date_str.equalsIgnoreCase(from_date_vec_str))) {
					checkIfIn = true;
				}
			}
			if (checkIfIn) {
				potentialInforceDataNew.add(potentialInforceData.get(i));
				
				//calculate the start and the end range for potential inforce
				if (potentialInforceForm.getStartTimeInforce() == null) {
					potentialInforceForm.setStartTimeInforce(potentialEmployeeBean.getStart_Potential());
					potentialInforceForm.setStartTimeInforceToCheck(potentialEmployeeBean.getStart_Potential());
				} else {
					if (potentialEmployeeBean.getStart_Potential().after(potentialInforceForm.getStartTimeInforce())) {
						potentialInforceForm.setStartTimeInforce(potentialEmployeeBean.getStart_Potential());
						potentialInforceForm.setStartTimeInforceToCheck(potentialEmployeeBean.getStart_Potential());
					}
				}

				if (potentialInforceForm.getEndTimeInforce() == null) {
					potentialInforceForm.setEndTimeInforce(potentialEmployeeBean.getEnd_Potential());
					potentialInforceForm.setEndTimeInforceToCheck(potentialEmployeeBean.getEnd_Potential());
				} else {
					if (potentialEmployeeBean.getEnd_Potential().before(potentialInforceForm.getEndTimeInforce())) {
						potentialInforceForm.setEndTimeInforce(potentialEmployeeBean.getEnd_Potential());
						potentialInforceForm.setEndTimeInforceToCheck(potentialEmployeeBean.getEnd_Potential());
					}
				}
				

				
			} 
		}
		//tamar
		 if(potentialInforceForm.getStartTimeInforce()!=null && potentialInforceForm.getEndTimeInforce()!=null){		
			 if (potentialInforceForm.getStartTimeInforce().after(potentialInforceForm.getEndTimeInforce())||
				 potentialInforceForm.getStartTimeInforce().equals(potentialInforceForm.getEndTimeInforce())){
				logger.error("error in getSelectedPotential() there is no common denominator between all the select workers : " );
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.noCommonDenominator",null));
				throw new ShfException(actionErrors);
			 
		  }
		 }
		//tamar
		return potentialInforceDataNew;
	}
	public void prapreSingleShiftData(int i) {
		addShiftForm.setEmployeeId(addShiftForm.getEmployeeIdPotentialAll()[i]);
		addShiftForm.setIdNumber(addShiftForm.getIdNumberPotentialAll()[i]);
		if (addShiftForm.getBreaksNumber()>0) {
			String[] bEnd = new String[addShiftForm.getBreaksNumber()];
			String[] bStart = new String[addShiftForm.getBreaksNumber()];
			int startStart=0;
			int startEnd=0;
			if (i==0) { startStart =5; startEnd = 4; }
			if (i>0) { startStart =5 + (i*6); startEnd = 4+(i*6); }
			
			for (int ii=0;ii<addShiftForm.getBreaksNumber();ii++) {
				bEnd[ii] =  addShiftForm.getBreakPotentialAll()[startEnd - (ii*2)];
				bStart[ii] =  addShiftForm.getBreakPotentialAll()[startStart - (ii*2)];
			}
			addShiftForm.setBreakStart(bStart);
			addShiftForm.setBreakEnd(bEnd);			
		}
		addShiftForm.setShiftLocation(addShiftForm.getShiftLocationAll()[i]);
	}
	
	public Boolean checkPoolExtensionAllocated(){	//TODO complete
		
		boolean result = false;
		
		
		return result;
		
	}
	
	public Vector populateManagerLoginCancel(String jobsIds) throws ShfException{
		//Yuval - get manager for login cancel
		logger.debug("Starting populateManagerLoginCancel() dayId = " + shiftLoginCancelForm.getAgentDayId());
		int param_index=1;
		EmployeeBean empBean=null;
		String moked=SHFTableUtils.getMokedCodeOf(shiftLoginCancelForm.getAgantOrgUnit());
		
		Vector approveManager=new Vector();
		StringBuffer sSql = new StringBuffer();
		sSql.append(" SELECT E.* ");
		sSql.append(" FROM SHIFTER.SHF_EMPLOYEES E " );
		sSql.append(" LEFT JOIN SHIFTER.SHF_ORG_UNIT O ON E.ORG_UNIT_ID = O.ORG_UNIT_ID " );
		sSql.append(" WHERE E.JOB_ID IN ( " );
		sSql.append( jobsIds );
		sSql.append(" )" );
		sSql.append(" AND ( (? = E.ORG_UNIT_ID) OR (? = O.PARENT_UNIT) ) ");
		sSql.append(" AND E.STATUS_ID = ?");
		sSql.append(" ORDER BY E.FIRST_NAME, E.LAST_NAME");

		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sSql.toString());
//			db.setString(param_index++,jobsIds);
			db.setString(param_index++,moked);
			db.setString(param_index++,moked);
			db.setInt(param_index++,SHFConstants.EMPLOYEE_STATUS_ACTIVE);
			db.executeQuery();
			while(db.next()){
				empBean=new EmployeeBean();
				db.populate(empBean);
				approveManager.add(empBean.getFname() + " " + empBean.getLname());
			}
			
		} catch (DBQueryNoRowsException e){
			
		} catch (DBException e) {
			logger.error("error in populateManagerLoginCancel : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.populateFailed",null));
			throw new ShfException(actionErrors);
		} finally{
			try{
				sSql=null;
				db.close();
			}catch (DBException e) {
				logger.error("error in populateManagerLoginCancel while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		return approveManager;
	}
	
	public void addLoginCancelEvent(ShiftLoginCancelForm loginCancel) throws ShfException {
		logger.debug("Starting addLoginCancelEvent()");
		
		int param_ind=1;
		StringBuffer sql=new StringBuffer();
		sql.append("INSERT INTO SHIFTER.SHF_CTI_CANCEL_LOGIN_SHIFTS ");
		sql.append("(SHF_EMPLOYEE_DAY_ID, "); //1
		sql.append(" APPLIER_NAME, "); //2
		sql.append(" UPDATER_NAME, "); //3
		sql.append(" CANCEL_LOGIN_REMARK, " ); //4
		sql.append(" UPDATE_DATE ) "); //5
		sql.append(" values(?,?,?,?,?)"); 

		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setLong(param_ind++,loginCancel.getAgentDayId()); //1
			db.setString(param_ind++,loginCancel.getApplierName()); //2
			db.setString(param_ind++,loginCancel.getUpdaterName()); //3
			db.setString(param_ind++,loginCancel.getCancelLoginRemark()); //4
			db.setTimestamp(param_ind++,new Date()); //5
			
			db.executeUpdate();
			
		} catch (DBDuplicateKeyException e) {
			logger.error("error in addLoginCancelEvent() :" +e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("error.db.duplicatekey"));
			throw new ShfException(actionErrors);
		} catch (DBException   e) {
			logger.error("error in addLoginCancelEvent() :" +e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in addLoginCancelEvent() while closing db connection :" +e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}	
	}
	public String getDirectManagerMail(int employeeId) throws ShfException {
		String managerMail = null;
		int managerId = getManagerId(employeeId);
		if (managerId > 0) 	{ managerMail = getEmployeeMail(managerId); }
		return managerMail;
	}

	public String getEmployeeMail(int managerId) throws ShfException {
		StringBuffer sql=new StringBuffer();
		sql.append("SELECT EMAIL FROM SHIFTER.SHF_EMPLOYEES WHERE EMPLOYEE_ID = ?");
		DBAccess db=null;
		EmployeeDataForm employeeData = new EmployeeDataForm();
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setInt(1,managerId);
			db.executeQuery();
			if(db.next()){
				db.populate(employeeData );
			}
		} catch (DBQueryNoRowsException e){
			logger.error("error in getEmployeeMail()  idnum:"+employeeData.getUserId()+" not found ");
		} catch (DBException e) {
			logger.error("error in getEmployeeMail() for idnum="+employeeData.getUserId()+" :"+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.populateFailed"));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in getEmployeeMail() while closing db connection :"+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		return employeeData.getEmail();
	}

	public int getManagerId(int employeeId) throws ShfException {
		StringBuffer sql=new StringBuffer();
		sql.append("SELECT MANAGER_ID FROM SHIFTER.SHF_EMPLOYEES WHERE EMPLOYEE_ID = ?");
		DBAccess db=null;
		EmployeeDataForm employeeData = new EmployeeDataForm();
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setInt(1,employeeId);
			db.executeQuery();
			if(db.next()){
				db.populate(employeeData );
			}
		} catch (DBQueryNoRowsException e){
			logger.error("error in getManagerId()  idnum:"+employeeData.getUserId()+" not found ");
		} catch (DBException e) {
			logger.error("error in getManagerId() for idnum="+employeeData.getUserId()+" :"+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.populateFailed"));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in getMyId() while closing db connection :"+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		return employeeData.getManagerId();
	}
	
	public Vector<PoolExtAllocBean> poolExtAllocRelease () throws ShfException {
		logger.debug("poolExtAllocRelease()");
		
		Vector<PoolExtAllocBean> result = new Vector<PoolExtAllocBean>();		
		AgentDayBean agentDayBean = populateShift(shiftForm.getAgentDayId());
		String mokedOrgUnitId = SHFTableUtils.getMokedCodeOf(agentDayBean.getOrgUnitCode());
		String poolEnabledStr = SHFParameters.getPoolEnabled(mokedOrgUnitId).getValue();
		Boolean poolEnabled = false;
		PoolExtAllocBean allocBean = null;
		
		Calendar cal1 = Calendar.getInstance();
		Calendar cal2 = Calendar.getInstance();
//		cal1.setTime(date1);
		cal2.setTime(agentDayBean.getShiftStart());
		boolean sameDay = cal1.get(Calendar.DAY_OF_YEAR) == cal2.get(Calendar.DAY_OF_YEAR) &&
		                  cal1.get(Calendar.YEAR) == cal2.get(Calendar.YEAR);
		 
		try {
			poolEnabled = Boolean.valueOf(poolEnabledStr);
		} catch (Exception e) {
			e.printStackTrace();
			poolEnabled = false;
		}
		
		if (poolEnabled && agentDayBean.isWorkingFromHome() && sameDay) {
			if (agentDayBean.getShiftExtNum() != null && "false".equals(shiftForm.getShiftExtNum()) || agentDayBean.getShiftExtNum() == null && "true".equals(shiftForm.getShiftExtNum())) {
				allocBean = new PoolExtAllocBean();
				allocBean.setDisplayMsg("נתוני הקצאת שלוחה במסך אינם מסונכרים עם השרת, יש לבצע ריענון במסך משמרות ולנסות שוב");
				result.add(allocBean);
			} else {
				agentDayBean.setPoolRequestType("true".equalsIgnoreCase(shiftForm.getShiftExtNum()) ? 2 : 1);	// if exist => release, if not => allocate
				Vector<AgentDayBean> agentDayBeans = new Vector<AgentDayBean>();
				agentDayBeans.add(agentDayBean);
				DBAccess db = null;
				
				try {
					db = new DBAccess();
					
					result = processPoolPopulation(agentDayBeans, db);
					
				} catch (Exception e) {
					logger.error(e);
				} finally{
					try {
						db.close();
					} catch (DBException e) {
						throw new ShfException("db.close()", e);
					}
				}
			}
		} else if (!poolEnabled){
			allocBean = new PoolExtAllocBean();
			allocBean.setDisplayMsg("הקצאת שלוחה אינה מופעלת עבור המוקד הנבחר");
			result.add(allocBean);
//			result = "הקצאת שלוחה אינה מופעלת עבור המוקד הנבחר";
		} else if (!"y".equalsIgnoreCase(agentDayBean.getWorkFromHome())){
			allocBean = new PoolExtAllocBean();
			allocBean.setDisplayMsg("המשמרת אינה מסוג עבודה מהבית");
			result.add(allocBean);
//			result = "המשמרת אינה מסוג עבודה מהבית";
		} else if (!sameDay) {
			allocBean = new PoolExtAllocBean();
			allocBean.setDisplayMsg("לא ניתן להקצות שלוחה למשמרת שאינה היום");
			result.add(allocBean);
		}
		
		if (result.size() == 0) {
			throw new ShfException("Unexpected error, result size is zero");
		}
		
		return result;
	}
	
	public void resetPoolExtension (Vector<Long> dayIds) throws ShfException{
		if (dayIds == null || dayIds.size() == 0) {
			return;
		}
		
		StringBuilder sql = new StringBuilder();
		StringBuilder inClause = new StringBuilder ();
		
		sql.append("UPDATE SHIFTER.SHF_EMPLOYEE_DAY t SET t.POOL_EXT_NUM = NULL, t.POOL_ERR = NULL WHERE t.shf_employee_day_id IN ");
		
		inClause.append("(");
		for (int i = 0; i < dayIds.size(); i++) {
			inClause.append(dayIds.get(i));
			
			if (i < dayIds.size() - 1) {
				inClause.append(",");
			}
		}
		inClause.append(")");
		
		DBAccess db = null;
		
		try {
		db = new DBAccess();
		
		db.prepareStatement(sql.toString() + inClause.toString());
		db.executeUpdate();
		
		sql = new StringBuilder();
		sql.append("UPDATE SHIFTER.SHF_DAY_CHANGES t SET t.NEW_POOL_EXT_NUM = NULL, t.NEW_POOL_ERR = NULL WHERE t.shf_employee_day_id IN ");
		
		db.prepareStatement(sql.toString() + inClause.toString());
		db.executeUpdate();
		
		} catch (DBUpdateNoRowsException e) {
			
		} catch (Exception e) {
			logger.error(e);
		} finally {
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error while closing db connection: "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}
	
public Vector<PoolExtAllocBean> processPoolPopulation(Vector<AgentDayBean> allocateBeforeShiftStart, DBAccess db ){
	
	Vector<PoolExtAllocBean> result = new Vector<PoolExtAllocBean>();
		
		try {
			
			long startTime = System.currentTimeMillis();
			
			for (AgentDayBean agentDayBean : allocateBeforeShiftStart) {
				
				try {
					StringBuilder host = new StringBuilder(20);
					host.append("poolws.bezeq.com");	// prod
					
					AppInfo appInfo = (AppInfo) getsCtx().getAttribute(bzq.utils.AppConstants.APP_INFO_KEY);
					
					if (appInfo == null) { 
						throw new ShfException("shf.login.noenvironment");
					}	
					
					String environment = appInfo.getEnvironment();
					
					if (!"p".equalsIgnoreCase(String.valueOf(environment.charAt(0)))) {
						host.insert(0, 't');	// test
					}
					
					long reqId = getPoolSeqNextVal(db);
					URIBuilder b = new URIBuilder();
					b.setScheme("http");
					b.setHost(host.toString());
					b.setPath("/pool/handle");
					b.addParameter("requestId", String.valueOf(reqId));
					b.addParameter("requestType", String.valueOf(agentDayBean.getPoolRequestType()));		// 1 = allocate new extension, 2 = release
					b.addParameter("divisionId", agentDayBean.getOrgUnitCode());
					b.addParameter("callCenterId", agentDayBean.getMokedCode());
					b.addParameter("agentId", agentDayBean.getEmpIdNumber());
					b.addParameter("firstName", agentDayBean.getFirstName());
					b.addParameter("lastName", agentDayBean.getLastName());
					b.addParameter("messageSendTime", new SimpleDateFormat("yyyyMMddHHmmss").format(new Date()));
					
					String reqResult = executeHttpRequestToPoolWS(b);	// send http request and get JSON response
					
					if (reqResult == null || reqResult.length() == 0) {
						logger.error("No http response returned, skipping day id : " + agentDayBean.getAgentDayId());
						String msg = "אירעה שגיאת רשת, יש לנסות מאוחר יותר";
//						result = msg;
						
						PoolExtAllocBean poolBean = new PoolExtAllocBean();
						poolBean.setDayId(agentDayBean.getAgentDayId());
						poolBean.setRequestId(reqId);
						poolBean.setTechMessageCode(105);	// 105 = שגיאה טכנית
						poolBean.setTechMessageDesc("אירעה שגיאת רשת, יש לנסות מאוחר יותר");
						poolBean.setMessageSendTime(new SimpleDateFormat("yyyyMMddHHmmss").format(new Date()));
						poolBean.setAgentId(agentDayBean.getEmpIdNumber());
						poolBean.setDayChanges(agentDayBean.getNewShiftStart() == null ? false : true);
						poolBean.setEmpCellNum(agentDayBean.getCellularPhone());
						poolBean.setRequestType(String.valueOf(agentDayBean.getPoolRequestType()));
						
						updateDataAfterHttpReq(poolBean, db, agentDayBean);
						
						result.add(poolBean);
						
						continue;
					}
					System.out.println(reqResult);
					
					ObjectMapper objMapper = new ObjectMapper();
					objMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
				    PoolExtAllocBean poolBean = objMapper.readValue(reqResult, PoolExtAllocBean.class);  // decode JSON string into POJO
				    poolBean.setDayId(agentDayBean.getAgentDayId());
				    poolBean.setDayChanges(agentDayBean.getNewShiftStart() == null ? false : true);
				    poolBean.setEmpCellNum(agentDayBean.getCellularPhone());
				    poolBean.setRequestType(String.valueOf(agentDayBean.getPoolRequestType()));

				    updateDataAfterHttpReq(poolBean, db, agentDayBean);
				    result.add(poolBean);
					
				} catch (Exception e) {	// foreach
					logger.error("Error in processPoolPopulation() for agent day id : " + agentDayBean.getAgentDayId() + ", error is : " + e.getMessage(), e);
				}
			}
			
			long endTime = System.currentTimeMillis();

			System.out.println("processPoolPopulation() execution time in milliseconds: " + (endTime - startTime));
			
		} catch (Exception e) {	// function
			logger.error("Error in processPoolPopulation() : " + e.getMessage(), e);
		}
		
		return result;
		
	}

private String executeHttpRequestToPoolWS (URIBuilder b) throws Exception {
	
	URL url = b.build().toURL();
	HttpURLConnection urlCon = (HttpURLConnection)url.openConnection();
	urlCon.setRequestMethod("GET");	
	urlCon.setReadTimeout(5000);	// 5 sec time out
//	urlCon.setRequestProperty("Accept-Charset", "UTF-8");
    String inputLine = null;
    StringBuilder response = new StringBuilder();
    
    try {
    	
        BufferedReader in = new BufferedReader(new InputStreamReader(urlCon.getInputStream(), Charset.forName("UTF-8")));
        
    	while ((inputLine = in.readLine()) != null) {
    		response.append(inputLine);
    	}
    	
    	in.close();
    	
    	return response.toString();
    	
	} catch (Exception e) {
		logger.error("Error while making http connection : " + e.getMessage(), e);
		
        try {
                int respCode = ((HttpURLConnection)urlCon).getResponseCode();
                BufferedReader in = new BufferedReader(new InputStreamReader(urlCon.getErrorStream(), Charset.forName("UTF-8")));
    	        inputLine = null;
    	        StringBuilder sb = new StringBuilder();
    	    	while ((inputLine = in.readLine()) != null) {
    	    		sb.append(inputLine);
    	    	}
    	    	in.close();
    	    	
    	    	logger.error("response code : " + respCode + ", Error body : " + sb.toString());

        } catch(IOException ex) {
        	ex.printStackTrace();
        }
        
        return "";
	}
}

public long getPoolSeqNextVal(DBAccess db) throws ShfException {
	logger.debug("Starting getSeqNextVal()" );
	long nextVal = 0;
	StringBuffer sql = new StringBuffer();
	sql.append("select SHIFTER.SHF_POOL_EXT_REQID.NEXTVAL FROM DUAL");
	try {
		db.prepareStatement(sql.toString());
		db.executeQuery();
	if(db.next()){	
		nextVal = db.getLong(1);
	}	
	} catch (DBException e) {
		logger.error("error in getSeqNextVal() : " + e.getMessage());
		ActionErrors actionErrors = new ActionErrors();
		actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
		throw new ShfException(actionErrors);
	}
	return nextVal;
}

public void updateDataAfterHttpReq (PoolExtAllocBean poolBean, DBAccess db, AgentDayBean dayBean) throws Exception {
	
	// update transaction table	-----------------------------------------------------------
	
	ObjectMapper mapper = new ObjectMapper();
	String json = mapper.writeValueAsString(poolBean);
	
	int param = 1;
	StringBuffer txSql = new StringBuffer();
	txSql.append("INSERT INTO SHIFTER.SHF_TRANSACTIONS (ID, TRANSACTION_ID, PROCESS_ID, SOURCE, DESTINATION, CREATION_DATE, EMPLOYEE_ID, XML_REQUEST ");
	
	if (poolBean.getTechMessageCode() != 1) {	// write only error messages
		txSql.append(", STATUS_DESCRIPTION");
	}
	txSql.append(") ");
	txSql.append("VALUES (SHIFTER.SHF_TRANSACTIONS_ID.NEXTVAL, SHIFTER.SHF_TRANSACTIONS_ID.CURRVAL, ?, ?, ?, ?, ?, ? ");	// 1, 2, 3, 4, 5, 6
	
	if (poolBean.getTechMessageCode() != 1) {	// write only error messages
		txSql.append(", ?");	// 7
	}
	txSql.append(")");
	
	db.prepareStatement(txSql.toString());
	db.setInt(param++, 0);	// 1
	db.setString(param++, "SHF");	// 2
	db.setString(param++, "POOL");	// 3
	db.setTimestamp(param++, new Date());	// 4
	db.setString(param++, SHFConstants.BREAK_SMS_USERID);	// 5
	db.setString(param++, json);	// 6
	if (poolBean.getTechMessageCode() != 1) {
		db.setString(param++, poolBean.getTechMessageDesc());	// 7
	}
	db.executeUpdate();
	
	
	// update shift				-----------------------------------------------------------
	
	String shiftTableName = poolBean.isDayChanges() ? "SHF_DAY_CHANGES" : "SHF_EMPLOYEE_DAY";
	String columnNameExtNum = poolBean.isDayChanges() ? "NEW_POOL_EXT_NUM" : "POOL_EXT_NUM";
	String columnNamePoolErr = poolBean.isDayChanges() ? "NEW_POOL_ERR" : "POOL_ERR";
	StringBuffer shiftSql = new StringBuffer();
	String smsMsg = "";
	String updatePoolErr = null;
	String logEntry = "";
	
	if (poolBean.getTechMessageCode() != 1) {
		updatePoolErr = "UPDATE SHIFTER." + shiftTableName + " t SET "+columnNamePoolErr+" = '" + poolBean.getTechMessageDesc()+ "' WHERE t.shf_employee_day_id = " + poolBean.getDayId();
		poolBean.setDisplayMsg(poolBean.getTechMessageDesc());
	}
	
	if ("1".equals(poolBean.getRequestType())) {	// 1 = allocate extension		
	
		if (poolBean.getTechMessageCode() == 1 || poolBean.getTechMessageCode() == 101) {	// 1 = SUCCESS, 101 = extension already allocated, update shifter side and resend sms to agent
			
			shiftSql.append("UPDATE SHIFTER." + shiftTableName + " t SET " + columnNameExtNum + " = " + poolBean.getExtensionId() + ", " + columnNamePoolErr + " = NULL WHERE t.shf_employee_day_id = " + poolBean.getDayId());
			smsMsg = "שלוחה מס' " + poolBean.getExtensionId() + " הוקצתה עבור המשמרת הקרובה. בברכה, בזק.";
			
			if (poolBean.getTechMessageCode() == 1) {
				
				logEntry = "Extension " + poolBean.getExtensionId() + " was allocated for shift id : " + poolBean.getDayId();
				poolBean.setDisplayMsg("שלוחה "+poolBean.getExtensionId()+" הוקצתה בהצלחה");
			} else {
//				smsMsg = "שלוחה מס' " + poolBean.getExtensionId() + " כבר קיימת עבור המשמרת הקרובה. בברכה, בזק.";
				logEntry = "Extension " + poolBean.getExtensionId() + " already exist for shift id : " + poolBean.getDayId();
				poolBean.setDisplayMsg("שלוחה " + poolBean.getExtensionId() + " כבר קיימת עבור המשמרת");
			}
		} else {
			shiftSql.append(updatePoolErr);
			
			if (dayBean.getShiftExtErr() == null) {		// prevent resending error SMS to agent, only for first error
				smsMsg = "לא ניתן להקצות שלוחה למשמרת. נא לפנות לבמה. בברכה, בזק.";
			}
			
			poolBean.setDisplayMsg(poolBean.getTechMessageDesc());
		}
	
	} else if ("2".equals(poolBean.getRequestType())) {		// 2 = release extension 
		
		if (poolBean.getTechMessageCode() == 1 || poolBean.getTechMessageCode() == 104) {	// 1 = SUCCESS, 104 = extension already released, update shifter side
			shiftSql.append("UPDATE SHIFTER." + shiftTableName + " t SET " + columnNameExtNum + " = NULL, " + columnNamePoolErr + " = NULL WHERE t.shf_employee_day_id = " + poolBean.getDayId());
			
//			if (poolBean.getTechMessageCode() == 1) {
			
			logEntry = "Extension was released for shift id : " + poolBean.getDayId();
			poolBean.setDisplayMsg("השלוחה שוחררה בהצלחה");
			
//			} else {
//				logEntry = "Extension not exist, updating shifter side for shift id : " + poolBean.getDayId();
//				poolBean.setDisplayMsg(poolBean.getTechMessageDesc());
//			}

		} else {
			logger.error("Error while releasing extension for shift id : " + poolBean.getDayId() + ", error code : " + poolBean.getTechMessageCode() + ", error desc : " + poolBean.getTechMessageDesc());
			poolBean.setDisplayMsg(poolBean.getTechMessageDesc());
		}
	}
	
	if (shiftSql.length() > 0) {
		db.prepareStatement(shiftSql.toString());		
		db.executeUpdate();
		if (logEntry.length() > 0) {
			logger.info(logEntry);
		}
	}

	
	// send SMS to agent		-----------------------------------------------------------
	if ("1".equals(poolBean.getRequestType()) && smsMsg.length() > 0) {	// send SMS only for allocate extension
		if (poolBean.getEmpCellNum() != null && poolBean.getEmpCellNum().length() > 0) {
			Vector<String> cellNum = new Vector<String>();
			cellNum.add(poolBean.getEmpCellNum());
			
			SHFSmsSender smsSender = new SHFSmsSender(cellNum, smsMsg, getsCtx());
			smsSender.sendSHFSmsQueueMessage();
			logger.info("Successfully sent SMS msg to :" + poolBean.getEmpCellNum() + ", body : " + smsMsg);
		}
	}
}
	
	public String AddShiftsFromFile() throws ShfException {
		
		// 1st Check the submitted file
		validateAddShiftsFormFile();
		logger.info("File validation complete ok");
		
		// 2nd try to parse the file and apply logic
		FormFile file = shiftForm.getShiftsFile();
		InputStream inStream = null;
		Scanner scnr = null;
		ArrayList<String> errors = new ArrayList<String>();

		try {
			inStream = new FileInputStream(((DiskFile)file).getFilePath());
			scnr = new Scanner(inStream);
			int line = 0;	// row num
			int emptyLines = 0;
			int resultColIdx = 0;
			
		    while (scnr.hasNextLine()) {	// scan lines
		    	line++;
		    	String rec = scnr.nextLine();
		    	ArrayList<String> recArr = new ArrayList(Arrays.asList(rec.split(",",-1)));	// populated and empty cells
		    	String[] recArrNoEmpty = rec.split(",");	// only populated cells
		    	boolean errorExist = false;
		    	
		    	if (line == 1) {	// Add "ERROR" column to header row if needed
		    		if (! recArr.contains("ERROR")) {
		    			recArr.add("ERROR");
					}
		    		resultColIdx = recArr.size() - 1;
				}
		    	if (recArrNoEmpty.length == 0) {
		    		emptyLines++;
				}
		    	
		    	if (line > 1 && recArrNoEmpty.length > 0) {	// if not header and not empty row
		    		int emptyCells = 0;
		    		ArrayList<String> recArrCopy = new ArrayList(recArr);	// copy is to avoid concurrent modification
		    		AddShiftForm addShiftForm = new AddShiftForm();
		    		addShiftForm.setBreakStart(new String[3]);
		    		addShiftForm.setBreakEnd(new String[3]);
		    		addShiftForm.setSourceActivity("add_extra_shift");
		    		addShiftForm.setRemark("");
		    		addShiftForm.setUserId(shiftForm.getUserId());
		    		addShiftForm.setUserFirstName(shiftForm.getUserFirstName());
		    		addShiftForm.setUserLastName(shiftForm.getUserLastName());
		    		
		    		for (int j = 0; j < recArrCopy.size(); j++) {	// scan cells per record line (column)
		    			String col = recArr.get(j).trim();
		    			boolean colIsEmpty = SHFUtils.isEmpty(col);
		    			
						if (j == 0) {	// 1st cell is ID NUM, length = 9, digits only including leading zeroes, "X" char allowed as 1st char for excel support (leading zero), not null
							if (col.startsWith("0")) {
								col = "X" + col;
							}
//							int len = col.startsWith("X") ? 10 : 9;
							String idNum = col.startsWith("X") ? col.substring(1) : col;
							
							if (colIsEmpty /*|| col.length() != len*/ || !idNum.matches("[0-9]{9}")) {
								String msg = "תעודת זהות לא תקינה";
								if (resultColIdx >= recArr.size()) {
									recArr.add(msg);
								} else {
									recArr.set(resultColIdx, msg);
								}
								errorExist = true;
								break;
							}
							addShiftForm.setIdNumber(idNum.substring(0, idNum.length()-1));
							addShiftForm.setFullIdNumber(idNum);
							
							recArr.set(j, col);	// save changes
						}
						
						if (j == 1) {	// 2nd cell is activity id, digits only, not null
							
							boolean matches = col.matches("[0-9]+");
							boolean exist = (matches && SHFTableUtils.getMokedNameOfActivity(col).length() > 0) ? true : false;		// if moked named returned then activity exist
							
							if (colIsEmpty || !matches || !exist) {
								String msg = "קוד תור לא קיים";
								if (!matches) {
									msg = "תור לא תקין";
								}

								if (resultColIdx >= recArr.size()) {
									recArr.add(msg);
								}else {
									recArr.set(resultColIdx, msg);
								}
								errorExist = true;
								break;
							}
							addShiftForm.setActivity(col);
						}
						
						if (j == 2) {	// 3rd cell is shift date in dd/mm/yyyy format, not null
							Date shiftDate = null;
							boolean validDate = colIsEmpty ? false : col.matches("([0-9]{2})/([0-9]{2})/([0-9]{4})") ? true : false;
							
							if (validDate) {
								try {
									shiftDate = BaseConvert.stringToDate(col, "mm/dd/yyyy");
								} catch (Exception e) {
									validDate = false;
								}
							}
							if (!validDate) {
								String msg = "תאריך משמרת לא תקין";
								if (resultColIdx >= recArr.size()) {
									recArr.add(msg);
								}else {
									recArr.set(resultColIdx, msg);
								}
								errorExist = true;
								break;
							}
							addShiftForm.setDate(col);
						}
						
						if (j == 3) {	// 4th cell is shift location (site/home), optional, default = site
							boolean validVal = true;
							
							if( !colIsEmpty && (!"h".equals(col.toLowerCase()) && !"m".equals(col.toLowerCase()) )) {
								validVal = false;
							}
							
							if (! validVal) {
								String msg = "מיקום משמרת לא תקין";
								if (resultColIdx >= recArr.size()) {
									recArr.add(msg);
								}else {
									recArr.set(resultColIdx, msg);
								}
								errorExist = true;
								break;
							} else {
								addShiftForm.setShiftLocation("h".equals(col.toLowerCase()) ? SHFConstants.SHIFT_LOCATION_HOME : SHFConstants.SHIFT_LOCATION_SITE);
							}
						}
						
						if (j > 3) {	// rest of the columns are hours in hh:mm format
							boolean isValid = true;
							String hour = null;
							if (j == 4 || j == 5) {	// shift start / end hour, not null
								isValid = !colIsEmpty;
							}
							if (isValid) {
								if (!colIsEmpty) {
									if (col.matches("^([0-1][0-9]|[2][0-3]):([0-5][0-9])$")) {
										try {
											hour = SHFUtils.formatDateToString(BaseConvert.stringToDate(col, "HH:mm"), "HH:mm");
										} catch (Exception e) {
											isValid = false;
										}
									} else {
										isValid = false;
									}
								}
							}
							
							String colName = "";
							if (!colIsEmpty) {
								if (j == 4) {
									if (isValid) {
										addShiftForm.setShiftStart(col);
									} else {
										colName = "תחילת משמרת";
									}
								} else if (j == 5) {
									if (isValid) {
										addShiftForm.setShiftEnd(col);
									} else {
										colName = "סוף משמרת";
									}
								} else if (j == 6 && !colIsEmpty) {
									if (isValid) {
										addShiftForm.setBreaksNumber(addShiftForm.getBreaksNumber()+1);
										addShiftForm.getBreakStart()[0] = col;
									} else {
										colName = "תחילת הפסקה 1";
									}
								} else if (j == 7) {
									if (isValid) {
										addShiftForm.getBreakEnd()[0] = col;
									} else {
										colName = "סוף הפסקה 1";
									}
								} else if (j == 8) {
									if (isValid) {
										addShiftForm.setBreaksNumber(addShiftForm.getBreaksNumber()+1);
										addShiftForm.getBreakStart()[1] = col;
									} else {
										colName = "תחילת הפסקה 2";
									}
								} else if (j == 9) {
									if (isValid) {
										addShiftForm.getBreakEnd()[1] = col;
									} else {
										colName = "סוף הפסקה 2";
									}
								} else if (j == 10) {
									if (isValid) {
										addShiftForm.setBreaksNumber(addShiftForm.getBreaksNumber()+1);
										addShiftForm.getBreakStart()[2] = col;
									} else {
										colName = "תחילת הפסקה 3";
									}
								} else if (j == 11) {
									if (isValid) {
										addShiftForm.getBreakEnd()[2] = col;
									} else {
										colName = "סוף הפסקה 3";
									}
								}
							}

							if (!SHFUtils.isEmpty(colName)) {
								String msg = "שעת "+colName+" לא תקין";
								if (resultColIdx >= recArr.size()) {
									recArr.add(msg);
								}else {
									recArr.set(resultColIdx, msg);
								}
								errorExist = true;
								break;
							}
						}
					}
		    		
					// 1st check if id num exist (since this involves DB querring perform this check only if all other columns (cells) are ok)

		    		if (!errorExist) {
		    			EmployeeDataForm empForm = new EmployeeDataForm();
						empForm.setIdNumber(addShiftForm.getFullIdNumber());
						EmployeeDataModel empModel = new EmployeeDataModel(empForm);
						try {
							empModel.populateByEmpIdNum();
						} catch (ShfException e) {
							String msg = shiftForm.getServlet().getResources().getMessage(((ActionError) e.getErrors().get().next()).getKey());
							logger.error(msg, e);
							
							if (resultColIdx >= recArr.size()) {
								recArr.add(msg);
							} else {
								recArr.set(resultColIdx, msg);
							}
							errorExist = true;
						}
						if (!errorExist) {
							String moked=SHFTableUtils.getMokedCodeOf(empForm.getOrgUnitId());
							addShiftForm.setMoked(moked);
							addShiftForm.setEmployeeId(empForm.getEmployeeId());
						}
						
						// 2nd check if acitivity belongs to agent's site
						if (!errorExist) {
							String empSiteId = SHFTableUtils.getSiteCodeOfUnit(addShiftForm.getMoked());
							String activitySiteId = SHFTableUtils.getSiteIdByActivityId(addShiftForm.getActivity());
							
							if (activitySiteId.length() == 0 || ! activitySiteId.equals(empSiteId)) {
								String msg = "תור לא תואם למוקד";
								
								if (resultColIdx >= recArr.size()) {
									recArr.add(msg);
								}else {
									recArr.set(resultColIdx, msg);
								}
								errorExist = true;	
							}
						}
						
						// if all cells are valid try add shift
						if (!errorExist) {
							addShiftForm.setSend(false);	// do not send breaks to SoftPhone
							ShiftDataModel shiftModel = new ShiftDataModel(addShiftForm);
							try {
								shiftModel.addSingleShift(addShiftForm.getSourceActivity());
								logger.info("Shift successfuly added on row num : " + line);
							} catch (ShfException e) {
								String msg = shiftForm.getServlet().getResources().getMessage(((ActionError) e.getErrors().get().next()).getKey());
								logger.error(msg);
								
								if (resultColIdx >= recArr.size()) {
									recArr.add(msg);
								}else {
									recArr.set(resultColIdx, msg);
								}
								errorExist = true;
							}
						}
		    		}
				}

		    	if (errorExist || line == 1) {	// i == 1 if there gonna be errors, prepare headers row
		    		if ( line > 1)
		    			logger.error("Error exist on row num : " + line);
		    		errors.add(SHFUtils.stringArrJoin((String[])recArr.toArray(new String[recArr.size()]), ","));
				}
		    }	// end line
		    
		    if (emptyLines == line - 1) {	// if all lines (except header) are empty (with comma but with out content)
		    	ActionErrors actErrors = new ActionErrors();
		    	actErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.upload.emptyFile"));
				throw new ShfException(actErrors);
			}
//		    System.out.println(line);
//		    System.out.println(emptyLines);
			
		} catch (FileNotFoundException e) {
			logger.error(e.getMessage(),e);
		} finally {
			if (scnr != null) {
				scnr.close();
			}
			if (inStream != null) {
				try {
					inStream.close();
				} catch (IOException e) {
					logger.error(e.getMessage(),e);
				}
			}
			if (file != null) {
				file.destroy();
				File f = new File(((DiskFile)file).getFilePath());
				if(f.exists() && !f.isDirectory()) { 
					logger.error("Upload temp file still exist after destroy() !!");
				} else {
					logger.info("Upload temp file does NOT exist after destroy()");
				}
			}
		}
		if (errors.size() > 1) {	// ignore headers row

			return SHFUtils.stringArrJoin((String[])errors.toArray(new String[errors.size()]), "\n");			
		} else {
			return "";
		}
	}
	
	public void validateAddShiftsFormFile() throws ShfException {
		
		if (shiftForm == null || shiftForm.getShiftsFile() == null) {
			logger.error("Form object is null while trying to validate");
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}
		
		FormFile file = shiftForm.getShiftsFile();
		String[] fileNameExt = file.getFileName().split("\\.");
		ActionErrors errors = null;
		
		if(file.getFileSize() == 0){
			logger.error("File size is 0");
			errors = new ActionErrors();
			errors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.upload.emptyFile"));
		}
		if (errors == null && file.getFileSize() > SHFConstants.ADD_SHIFTS_FILE_MAX_SIZE) {
			logger.error("File size is bigger then allowed, file size : "+file.getFileSize()+" bytes, allowed size : "+SHFConstants.ADD_SHIFTS_FILE_MAX_SIZE+" bytes");
			errors = new ActionErrors();
			errors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.upload.fileSizeTooBig"));
		}
		if (errors == null && (fileNameExt.length == 1 || !fileNameExt[fileNameExt.length - 1].equals("csv"))) {
			logger.error("File type extension is invalid (missing or not allowed), file type : "+(fileNameExt.length == 1 ? "MISSING" : fileNameExt[fileNameExt.length - 1])+"");
			errors = new ActionErrors();
			errors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.upload.wrongFileType"));
		}
		
		Scanner scnr;
		int lines = 0;
		int headerColNum = 0;
		
		if (errors == null) {
			try {
				InputStream inStream = file.getInputStream();
				scnr = new Scanner(inStream);
				
			    while (scnr.hasNextLine()) {
			    	
			    	lines++;
			    	String rec = scnr.nextLine();
			    	String[] recArr = rec.split(",", -1);	// -1 to keep empty values
			    	
			    	if (lines == 1) {	// first row is headers
			    		headerColNum = recArr.length;
					}
			    	
			    	if (headerColNum != recArr.length ) {
						logger.error("Error, amount of columns of current record is not matching the amount of header columns, line number: " + lines);
						errors = new ActionErrors();
						errors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.upload.wrongFileType"));
					}
			    	
//			        System.out.println(rec);
			    }
			    scnr.close();
			    
			} catch (Exception e1) {
				logger.error("Error while parsing the file: ", e1);
				errors = new ActionErrors();
				errors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			}
		}		

		if (errors == null && (lines < 2 || headerColNum < SHFConstants.ADD_SHIFTS_FILE_MIN_COL)) {
			if (lines < 2) {
				logger.error("File has less than minimum 2 lines, aborting");
			} else {
				logger.error("Columns amount is less than minimum of " + SHFConstants.ADD_SHIFTS_FILE_MIN_COL + ", aborting");
			}
			errors = new ActionErrors();
			errors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.upload.csv.invalidFile"));
		}

		if (errors != null) {
			file.destroy();
			throw new ShfException(errors);
		}
		
		logger.info("Upload temp file path: " + ((DiskFile)file).getFilePath());
	}
	
	
	// --------------
	
	public ServletContext getsCtx() {
		return sCtx;
	}
	public void setsCtx(ServletContext sCtx) {
		this.sCtx = sCtx;
	}
}

