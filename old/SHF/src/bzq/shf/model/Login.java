/*
 * Created on 31/01/2008
 *
 */
package bzq.shf.model;

import java.util.Iterator;
import java.util.Vector;

import org.apache.log4j.Logger;
import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;

import bzq.db.DBAccess;
import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.shf.forms.LoginForm;
import bzq.shf.forms.OrgUnitTableForm;
import bzq.shf.profile.UserProfile;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.SHFTableUtils;
import bzq.shf.utils.ShfException;
import bzq.utils.AppResources;
import bzq.utils.TablesContainer;

public class Login {
	private static Logger logger = Logger.getLogger(Login.class);
	private LoginForm loginForm;
	public final static String USERNOTVALID = "shf.login.usernotvalid";

	public Login(LoginForm loginForm) {
		this.loginForm = loginForm;
	}

	/**
	 * טעינה של פרופיל משתמש
	 */
	public UserProfile load() throws ShfException, DBException {
		logger.debug("Starting load()");
		UserProfile userProfile = new UserProfile();
		ActionErrors actionErrors = new ActionErrors();

		String generalAuthorization = loginForm.getGeneralAuthorization();
		String userFirstName = loginForm.getUserfirstname();
		String userLastName = loginForm.getUserlastname();
		String user = loginForm.getUser();

		if (generalAuthorization == null
			|| generalAuthorization == ""
			|| userFirstName == null
			|| userFirstName == ""
			|| userLastName == null
			|| userLastName == ""
			|| user == null
			|| user == "") {
			actionErrors.add("user", new ActionError(USERNOTVALID));
			throw new ShfException(actionErrors);
		}

		//initiate the UserProfile
		userProfile.setAllowedMode(generalAuthorization);
		userProfile.setFirstName(userFirstName);
		userProfile.setLastName(userLastName);
		userProfile.setId(user);

		//Yuval 23.12.2010
		setAllowedToReplace(userProfile);
		
		String unit=null;
		
		try{
			unit=setAuthorization(generalAuthorization, userProfile);
		}catch (ShfException e) {}
		
		if(unit==null)
			unit=setAllowedUnit(userProfile);
		
		if(unit!=null && unit.trim().length()>0)
			setAllowedUnits(unit, userProfile);
		else
			throw new ShfException(new ActionError("shf.login.usernotvalid"));
		return userProfile;
	}
	
	private void setAllowedToReplace(UserProfile userProfile) throws ShfException{
		//get replace allowed from employees
		StringBuffer sql=new StringBuffer();
		sql.append("SELECT e.replace_allowed FROM shifter.shf_employees e ");
		sql.append("LEFT JOIN shifter.shf_org_unit u ON e.org_unit_id=u.org_unit_id ");
		sql.append("WHERE e.emp_id_number=? ");
		int param=1;
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setString(param++,loginForm.getUser());
			db.executeQuery();
			if(db.next()){
				userProfile.setAllowedReplace(db.getString(1));
			}
		}catch(DBQueryNoRowsException e){
			
		}catch(DBException e){
			logger.error("error in setAllowedToReplace(): "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in setAllowedToReplace() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
	}
	
	private String setAllowedUnit(UserProfile userProfile) throws ShfException{
		StringBuffer sql=new StringBuffer();
		sql.append("SELECT u.org_unit_id, e.employee_id FROM shifter.shf_employees e ");
		sql.append("LEFT JOIN shifter.shf_org_unit u ON e.org_unit_id=u.org_unit_id ");
		sql.append("WHERE e.emp_id_number=? ");
		int param=1;
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setString(param++,loginForm.getUser());
			db.executeQuery();
			if(db.next()){
				userProfile.setEmployeeId(db.getInt(2));
				return db.getString(1); 	
			}
		}catch(DBQueryNoRowsException e){
			
		}catch(DBException e){
			logger.error("error in setAllowedUnit(): "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in setAllowedUnit() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
		return null;
	}
	
	private void setAllowedUnits(String specificAuthorization,UserProfile userProfile)throws ShfException {
			logger.debug("Starting setAllowedUnits()");
			
			Vector allowedUnits = new Vector();	
			AppResources appRes=AppResources.getInstance();
			TablesContainer tc=appRes.getTablesContainer();
			Vector units=tc.getTable("unitCode");
			
			OrgUnitTableForm unit=SHFTableUtils.getUnitByCode(specificAuthorization);
			if(unit.getCode().equals("00020000")){
				for (Iterator iterator = units.iterator(); iterator.hasNext();) {
					OrgUnitTableForm orgUnit = (OrgUnitTableForm) iterator.next();
					if(orgUnit.getType()!=null && orgUnit.getParent()!=null){
						allowedUnits.add(orgUnit.getCode());
					}
				}
			}
			else if(unit.getType().equals(SHFConstants.HATIVA_UNIT)){
				for(int i=0;i<units.size();i++){
					OrgUnitTableForm u=(OrgUnitTableForm)units.get(i);
					if(u.getParent().trim().equals(specificAuthorization.trim())){
						allowedUnits.add(u.getCode());
						for(int j=0;j<units.size();j++){
							OrgUnitTableForm t=(OrgUnitTableForm)units.get(j);
							if(t.getParent().equals(u.getCode())){
								allowedUnits.add(t.getCode());
								for(int k=0;k<units.size();k++){
									OrgUnitTableForm n=(OrgUnitTableForm)units.get(k);
									if(n.getParent().equals(t.getCode())){
										allowedUnits.add(n.getCode());
									}
								}
							}
						}
					}
				}
				
				allowedUnits.add(unit.getCode());
				
				
			}else if(unit.getType().equals(SHFConstants.AGAF_UNIT)){
				userProfile.setAllowedAgaf(unit.getCode());
				for(int i=0;i<units.size();i++){
					OrgUnitTableForm u=(OrgUnitTableForm)units.get(i);
					if(u.getParent().trim().equals(specificAuthorization.trim())){
						allowedUnits.add(u.getCode());
						for(int j=0;j<units.size();j++){
							OrgUnitTableForm t=(OrgUnitTableForm)units.get(j);
							if(t.getParent().equals(u.getCode())){
								allowedUnits.add(t.getCode());
							}
						}
					}
				}
				for(int i=0;i<2;i++){
					allowedUnits.add(unit.getCode());
					unit=SHFTableUtils.getUnitByCode(unit.getParent());
				}
				
			}else if(unit.getType().equals(SHFConstants.MOKED_UNIT)){
				userProfile.setAllowedMoked(unit.getCode());
				userProfile.setAllowedAgaf(unit.getParent());
				for(int i=0;i<units.size();i++){
					OrgUnitTableForm u=(OrgUnitTableForm)units.get(i);
					if(u.getParent().equals(unit.getCode())){
						allowedUnits.add(u.getCode());
					}
				}
				for(int i=0;i<3;i++){
					allowedUnits.add(unit.getCode());
					unit=SHFTableUtils.getUnitByCode(unit.getParent());
				}
			}else if(unit.getType().equals(SHFConstants.TEAM_UNIT)){
				setAllowedUnits(unit.getParent(),userProfile);
				return;
			}
			userProfile.setAllowedUnits(allowedUnits);
	}
	
	
	private String setAuthorization(String general,UserProfile userProfile)throws ShfException {
		logger.debug("Starting setAuthorization()");
		Vector allowedActivities = new Vector();
		String unit=null;
		StringBuffer sql1=new StringBuffer();
		sql1.append("select a.activity_key from SHIFTER.shf_security_profile t ");
		sql1.append("left join SHIFTER.shf_security_activities a on a.activity_id=t.activity_id ");
		sql1.append("left join SHIFTER.shf_user_profile p on p.user_profile_code=t.user_profile_code ");
		sql1.append("where p.user_profile_code = ?");
		
		StringBuffer sql2=new StringBuffer();
		sql2.append("select p.fixed_unit from SHIFTER.shf_user_profile p ");
		sql2.append("where p.user_profile_code = ?");
		
		DBAccess db=null;
		try{
			db=new DBAccess();
			db.prepareStatement(sql2.toString());
			db.setString(1,general);
			try{
				db.executeQuery();
				unit=db.getString(1);
			}catch(DBException e) {
				unit=null;
			}
			
			db.prepareStatement(sql1.toString());
			db.setString(1,general);
			db.executeQuery();
			while(db.next()){
				allowedActivities.add(db.getString(1));
			}
			
			userProfile.setAllowedActivities(allowedActivities);
		} catch(DBQueryNoRowsException e){
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.invalidUser", null));
			throw new ShfException(actionErrors);
			
		} catch(DBException e){
			logger.error("error in setAuthorization: "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in setAuthorization while closing db connection : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
		return unit;
	}
}


