/*
 * Created on 17/02/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.utils;

import java.util.Date;

import org.apache.log4j.Logger;
import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;

import bzq.db.DBAccess;
import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.shf.bean.AgentDayBean;
import bzq.shf.forms.ShiftDataForm;
import bzq.utils.BaseConvert;
import bzq.utils.ConvertException;

/**
 * @author 02964437
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class CheckValidDate {
	protected AgentDayBean shiftData;
	protected String empId;
	protected String newShiftStart;
	protected String newShiftEnd;
	protected String moked;
	
	private Logger logger=Logger.getLogger(CheckValidDate.class);
	/**
	 * check for a new shift
	 */
	public CheckValidDate() {
	}
	/**
	 *check for existing shift
	 */
	public CheckValidDate(AgentDayBean AD) {
		shiftData = AD;
	}
	
	public void checkAddedShift() throws ShfException{
		
		StringBuffer sql=new StringBuffer();
		int param=1;
		sql.append("select d.* from SHIFTER.shf_employee_day d ");
		sql.append("LEFT JOIN SHIFTER.SHF_DAY_CHANGES C ON D.SHF_EMPLOYEE_DAY_ID=C.SHF_EMPLOYEE_DAY_ID ");
		sql.append("where nvl(c.new_employee_id,d.emp_id_number) = ? "); //1
		sql.append("and d.shf_employee_day_id <> ? "); //2
		sql.append("and(  ");
		sql.append("(? > nvl(C.NEW_SHIFT_START, d.wm_shift_start_datetime)-?/24 and ? < NVL(C.NEW_SHIFT_END, D.WM_SHIFT_END_DATETIME)+?/24) "); //3 4 5 6
		sql.append("or ");
		sql.append("(? > nvl(C.NEW_SHIFT_START, d.wm_shift_start_datetime)-?/24 and ? < NVL(C.NEW_SHIFT_END, D.WM_SHIFT_END_DATETIME)+?/24) "); // 7 8 9 10
		sql.append(") ");
		
		String minHours=SHFParameters.getMinHoursBetweenShifts(SHFTableUtils.getUnitCodeOfSite(shiftData.getSiteId())).getValue();
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setString(param++,shiftData.getEmpIdNumber()); //1
			db.setLong(param++,shiftData.getAgentDayId());  //2
			db.setTimestamp(param++,shiftData.getShiftStart()); // 3
			db.setString(param++,minHours); //4
			db.setTimestamp(param++,shiftData.getShiftStart()); //5
			db.setString(param++,minHours); //6
			db.setTimestamp(param++,shiftData.getShiftEnd());  //7
			db.setString(param++,minHours); //8
			db.setTimestamp(param++,shiftData.getShiftEnd());  //9
			db.setString(param++,minHours); //10
			
			db.executeQuery();
			if(db.next()){
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.updateFailedShiftInRange", null));					
				throw new ShfException(actionErrors);
			}
			
		}catch(DBQueryNoRowsException e){
			
		}catch(DBException e){
			logger.error("error in checkAddedShift(): "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
	}
		public void checkAddedShiftInforce() throws ShfException{
		
			StringBuffer sql=new StringBuffer();
			int param=1;
			sql.append("select d.* from SHIFTER.shf_employee_day d ");
			sql.append("LEFT JOIN SHIFTER.SHF_DAY_CHANGES C ON D.SHF_EMPLOYEE_DAY_ID=C.SHF_EMPLOYEE_DAY_ID ");
			sql.append("where nvl(c.new_employee_id,d.emp_id_number) = ? "); //1
			sql.append("and d.shf_employee_day_id <> ? "); //2
			sql.append("and(  ");
			sql.append("(? > nvl(C.NEW_SHIFT_START, d.wm_shift_start_datetime)-?/24 and ? < NVL(C.NEW_SHIFT_END, D.WM_SHIFT_END_DATETIME)+?/24) "); //3 4 5 6
			sql.append("or ");
			sql.append("(? > nvl(C.NEW_SHIFT_START, d.wm_shift_start_datetime)-?/24 and ? < NVL(C.NEW_SHIFT_END, D.WM_SHIFT_END_DATETIME)+?/24) "); // 7 8 9 10
			sql.append(") ");
			
			
			int shiftRangeFromStart=Integer.parseInt(SHFParameters.getMinimumTimeFromLastSHift(shiftData.getSiteId()).getValue())/60;
			int shiftRangeFromEnd = Integer.parseInt(SHFParameters.getMinimumTimeFromNextSHift(shiftData.getSiteId()).getValue())/60;
			
				
			DBAccess db=null;
			try{
				db=new DBAccess();
				db.prepareStatement(sql.toString());
				db.setString(param++,shiftData.getEmpIdNumber()); //1
				db.setLong(param++,shiftData.getAgentDayId());  //2
				db.setTimestamp(param++,shiftData.getShiftStart()); // 3
				db.setInt(param++,shiftRangeFromStart); //4
				db.setTimestamp(param++,shiftData.getShiftStart()); //5
				db.setInt(param++,shiftRangeFromEnd); //6
				db.setTimestamp(param++,shiftData.getShiftEnd());  //7
				db.setInt(param++,shiftRangeFromStart); //8
				db.setTimestamp(param++,shiftData.getShiftEnd());  //9
				db.setInt(param++,shiftRangeFromEnd); //10
				
				db.executeQuery();
				if(db.next()){
					ActionErrors actionErrors = new ActionErrors();
					actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.updateFailedShiftInRange", null));					
					throw new ShfException(actionErrors);
				}
				
			}catch(DBQueryNoRowsException e){
				
			}catch(DBException e){
				logger.error("error in checkAddedShift(): "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}finally{
				try {
					db.close();
				} catch (DBException e) {
					ActionErrors actionErrors = new ActionErrors();
					actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
					throw new ShfException(actionErrors);
				}
			}
		}
		
	public void checkValidDateBetweenShifts() throws ShfException{
		Date newShiftStartDateTime = ((ShiftDataForm)shiftData).getNewStartDate();
		Date newShiftEndDateTime = ((ShiftDataForm)shiftData).getNewEndDate();
		
		try{
			newShiftStartDateTime=BaseConvert.stringToDate(BaseConvert.dateToString(((ShiftDataForm)shiftData).getNewStartDate(),"dd/MM/yyyy")+" "+((ShiftDataForm)shiftData).getNewStartTime(),"dd/MM/yyyy HH:mm");
			newShiftEndDateTime=BaseConvert.stringToDate(BaseConvert.dateToString(((ShiftDataForm)shiftData).getNewEndDate(),"dd/MM/yyyy")+" "+((ShiftDataForm)shiftData).getNewEndTime(),"dd/MM/yyyy HH:mm");
		}catch(ConvertException e){
			e.printStackTrace();
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));					
			throw new ShfException(actionErrors); 
		}
		
		
		if(newShiftEndDateTime.before(newShiftStartDateTime)){	
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.updateFailedEndBeforeStart", null));					
			throw new ShfException(actionErrors); 
		}

		/*if(newShiftStartDateTime.before(new Date())){	
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.updateFailedStartBeforeCurrent", null));					
			throw new ShfException(actionErrors); 
		}*/
		
		
		StringBuffer sql=new StringBuffer();
		int param=1;
		sql.append("select d.* from SHIFTER.shf_employee_day d ");
		sql.append("LEFT JOIN SHIFTER.SHF_DAY_CHANGES C ON D.SHF_EMPLOYEE_DAY_ID=C.SHF_EMPLOYEE_DAY_ID ");
		sql.append("where nvl(c.new_employee_id,d.emp_id_number) = ? "); //1
		sql.append("and d.shf_employee_day_id <> ? "); //2
		sql.append("and(  ");
		sql.append("(? > nvl(C.NEW_SHIFT_START, d.wm_shift_start_datetime)-?/24 and ? < NVL(C.NEW_SHIFT_END, D.WM_SHIFT_END_DATETIME)+?/24) "); //3 4 5 6
		sql.append("or ");
		sql.append("(? > nvl(C.NEW_SHIFT_START, d.wm_shift_start_datetime)-?/24 and ? < NVL(C.NEW_SHIFT_END, D.WM_SHIFT_END_DATETIME)+?/24) "); // 7 8 9 10
		sql.append(") ");
		
		String minHours=SHFParameters.getMinHoursBetweenShifts(SHFTableUtils.getUnitCodeOfSite(shiftData.getSiteId())).getValue();
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setString(param++,shiftData.getEmpIdNumber()); //1
			db.setLong(param++,shiftData.getAgentDayId()); //2
			db.setTimestamp(param++,newShiftStartDateTime); // 3
			db.setString(param++,minHours); //4
			db.setTimestamp(param++,newShiftStartDateTime); //5
			db.setString(param++,minHours); //6
			db.setTimestamp(param++,newShiftEndDateTime); //7
			db.setString(param++,minHours); //8
			db.setTimestamp(param++,newShiftEndDateTime); //9
			db.setString(param++,minHours); //10
			
			db.executeQuery();
			if(db.next()){
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.updateFailedShiftInRange", null));					
				throw new ShfException(actionErrors);
			}
			
		}catch(DBQueryNoRowsException e){
			
		}catch(DBException e){
			logger.error("Error in checkValidDateBetweenShifts() : "+e.getMessage(), e);
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
	}
	public void checkValidDateBetweenShiftsInforce() throws ShfException{
		Date newShiftStartDateTime = ((ShiftDataForm)shiftData).getNewStartDate();
		Date newShiftEndDateTime = ((ShiftDataForm)shiftData).getNewEndDate();
		
		try{
			newShiftStartDateTime=BaseConvert.stringToDate(BaseConvert.dateToString(((ShiftDataForm)shiftData).getNewStartDate(),"dd/MM/yyyy")+" "+((ShiftDataForm)shiftData).getNewStartTime(),"dd/MM/yyyy HH:mm");
			newShiftEndDateTime=BaseConvert.stringToDate(BaseConvert.dateToString(((ShiftDataForm)shiftData).getNewEndDate(),"dd/MM/yyyy")+" "+((ShiftDataForm)shiftData).getNewEndTime(),"dd/MM/yyyy HH:mm");
		}catch(ConvertException e){
			e.printStackTrace();
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));					
			throw new ShfException(actionErrors); 
		}
		
		
		if(newShiftEndDateTime.before(newShiftStartDateTime)){	
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.updateFailedEndBeforeStart", null));					
			throw new ShfException(actionErrors); 
		}

		/*if(newShiftStartDateTime.before(new Date())){	
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.updateFailedStartBeforeCurrent", null));					
			throw new ShfException(actionErrors); 
		}*/
		
		
		StringBuffer sql=new StringBuffer();
		int param=1;
		sql.append("select d.* from SHIFTER.shf_employee_day d ");
		sql.append("LEFT JOIN SHIFTER.SHF_DAY_CHANGES C ON D.SHF_EMPLOYEE_DAY_ID=C.SHF_EMPLOYEE_DAY_ID ");
		sql.append("where nvl(c.new_employee_id,d.emp_id_number) = ? "); //1
		sql.append("and d.shf_employee_day_id <> ? "); //2
		sql.append("and(  ");
		sql.append("(? > nvl(C.NEW_SHIFT_START, d.wm_shift_start_datetime)-?/24 and ? < NVL(C.NEW_SHIFT_END, D.WM_SHIFT_END_DATETIME)+?/24) "); //3 4 5 6
		sql.append("or ");
		sql.append("(? > nvl(C.NEW_SHIFT_START, d.wm_shift_start_datetime)-?/24 and ? < NVL(C.NEW_SHIFT_END, D.WM_SHIFT_END_DATETIME)+?/24) "); // 7 8 9 10
		sql.append(") ");
		
		//String minHours=SHFParameters.getMinHoursBetweenShifts(SHFTableUtils.getUnitCodeOfSite(shiftData.getSiteId())).getValue();
		int shiftRangeFromStart=Integer.parseInt(SHFParameters.getMinimumTimeFromLastSHift(shiftData.getSiteId()).getValue())/60;
		int shiftRangeFromEnd = Integer.parseInt(SHFParameters.getMinimumTimeFromNextSHift(shiftData.getSiteId()).getValue())/60;
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setString(param++,shiftData.getEmpIdNumber()); //1
			db.setLong(param++,shiftData.getAgentDayId()); //2
			db.setTimestamp(param++,newShiftStartDateTime); // 3
			db.setInt(param++,shiftRangeFromStart); //4
			db.setTimestamp(param++,newShiftStartDateTime); //5
			db.setInt(param++,shiftRangeFromEnd); //6
			db.setTimestamp(param++,newShiftEndDateTime); //7
			db.setInt(param++,shiftRangeFromStart); //8
			db.setTimestamp(param++,newShiftEndDateTime); //9
			db.setInt(param++,shiftRangeFromEnd); //10
			
			db.executeQuery();
			if(db.next()){
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.updateFailedShiftInRange", null));					
				throw new ShfException(actionErrors);
			}
			
		}catch(DBQueryNoRowsException e){
			
		}catch(DBException e){
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
	}
	public static void checkSwitch(AgentDayBean firstBean,AgentDayBean secondBean) throws ShfException{
//		System.out.println("firstBean: "+firstBean.getEmpIdNumber()+" day id: "+firstBean.getAgentDayId()+" secondBean: "+secondBean.getEmpIdNumber()+" day id: "+secondBean.getAgentDayId()+" site: "+firstBean.getSiteId());
		StringBuffer sql=new StringBuffer();
		int param=1;
		sql.append("select d.* from SHIFTER.shf_employee_day d ");
		sql.append("LEFT JOIN SHIFTER.SHF_DAY_CHANGES C ON D.SHF_EMPLOYEE_DAY_ID=C.SHF_EMPLOYEE_DAY_ID ");
		sql.append("where COALESCE(c.new_employee_id,d.emp_id_number) = ? "); //1
		sql.append("and d.shf_employee_day_id <> ? "); //2
		sql.append("and(  ");
		sql.append("(to_date(?,'dd/MM/yyyy HH24:mi') > COALESCE(C.NEW_SHIFT_START, d.wm_shift_start_datetime)-?/24 and to_date(?,'dd/MM/yyyy HH24:mi') < COALESCE(C.NEW_SHIFT_END, D.WM_SHIFT_END_DATETIME)+?/24) "); //3 4 5 6
		sql.append("or ");
		sql.append("(to_date(?,'dd/MM/yyyy HH24:mi') > COALESCE(C.NEW_SHIFT_START, d.wm_shift_start_datetime)-?/24 and to_date(?,'dd/MM/yyyy HH24:mi') < COALESCE(C.NEW_SHIFT_END, D.WM_SHIFT_END_DATETIME)+?/24) "); // 7 8 9 10
		sql.append(") ");
	
		String minHoursStr=SHFParameters.getMinHoursBetweenShifts(SHFTableUtils.getUnitCodeOfSite(firstBean.getSiteId())).getValue();
		int minHours=Integer.parseInt(minHoursStr);
//		System.out.println("min hours :"+minHours);
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			
			db.setString(param++,firstBean.getEmpIdNumber()); //1
//			System.out.println(firstBean.getEmpIdNumber());
			db.setLong(param++,firstBean.getAgentDayId()); //2
//			System.out.println(firstBean.getAgentDayId());
			db.setString(param++,BaseConvert.dateToString(secondBean.getShiftStart(),"dd/MM/yyyy HH:mm")); // 3
//			System.out.println(BaseConvert.dateToString(secondBean.getShiftStart(),"dd/MM/yyyy HH:mm"));
			db.setInt(param++,minHours); //4
//			System.out.println(minHours);
			db.setString(param++,BaseConvert.dateToString(secondBean.getShiftStart(),"dd/MM/yyyy HH:mm")); //5
//			System.out.println(BaseConvert.dateToString(secondBean.getShiftStart(),"dd/MM/yyyy HH:mm"));
			db.setInt(param++,minHours); //6
//			System.out.println(minHours);
			db.setString(param++,BaseConvert.dateToString(secondBean.getShiftEnd(),"dd/MM/yyyy HH:mm")); //7
//			System.out.println(BaseConvert.dateToString(secondBean.getShiftEnd(),"dd/MM/yyyy HH:mm"));
			db.setInt(param++,minHours); //8
//			System.out.println(minHours);
			db.setString(param++,BaseConvert.dateToString(secondBean.getShiftEnd(),"dd/MM/yyyy HH:mm")); //9
//			System.out.println(BaseConvert.dateToString(secondBean.getShiftEnd(),"dd/MM/yyyy HH:mm"));
			db.setInt(param++,minHours); //10
//			System.out.println(minHours);
//			System.out.println(sql.toString());
//			System.out.println("secondBean start: "+BaseConvert.dateToString(secondBean.getShiftStart(),"dd/MM/yyyy HH:mm")+" end: "+BaseConvert.dateToString(secondBean.getShiftEnd(),"dd/MM/yyyy HH:mm"));
			db.executeQuery();
			if(db.next()){
				AgentDayBean day=new AgentDayBean();
				db.populate(day);
//				System.out.println("checkSwitch() updateFailedShiftInRange");
//				System.out.println("db sec start: "+BaseConvert.dateToString(day.getWmShiftStartTime(),"dd/MM/yyyy HH:mm")+" end: "+BaseConvert.dateToString(day.getWmShiftEndTime(),"dd/MM/yyyy HH:mm"));
//				System.out.println("min param day id:"+day.getAgentDayId());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.updateFailedShiftInRange", null));					
				throw new ShfException(actionErrors);
			}
		
		}catch(DBQueryNoRowsException e){
//			System.out.println("no results checkSwitch() select");
		
		}catch(DBException e){
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
	}
	
	/**
	 * @return
	 */
	public String getEmpId() {
		return empId;
	}

	
	/**
	 * @return
	 */
	public String getNewShiftEnd() {
		return newShiftEnd;
	}

	/**
	 * @return
	 */
	public String getNewShiftStart() {
		return newShiftStart;
	}

	/**
	 * @return
	 */
	public AgentDayBean getShiftData() {
		return shiftData;
	}

	/**
	 * @param string
	 */
	public void setEmpId(String string) {
		empId = string;
	}

	
	/**
	 * @param string
	 */
	public void setNewShiftEnd(String string) {
		newShiftEnd = string;
	}

	/**
	 * @param string
	 */
	public void setNewShiftStart(String string) {
		newShiftStart = string;
	}

	/**
	 * @param bean
	 */
	public void setShiftData(AgentDayBean bean) {
		shiftData = bean;
	}

	/**
	 * @return
	 */
	public String getMoked() {
		return moked;
	}

	/**
	 * @param string
	 */
	public void setMoked(String string) {
		moked = string;
	}

}
