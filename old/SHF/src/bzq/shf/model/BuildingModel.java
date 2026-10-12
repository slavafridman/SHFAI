package bzq.shf.model;

import java.util.ArrayList;
import java.util.Vector;

import org.apache.log4j.Logger;
import org.apache.struts.action.ActionError;

import bzq.db.DBAccess;
import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.db.DBUpdateNoRowsException;
import bzq.shf.forms.BuildingForm;
import bzq.shf.forms.TeamForm;
import bzq.shf.utils.ShfException;

public class BuildingModel {
	
	private static Logger logger=Logger.getLogger(BuildingModel.class);
	private BuildingForm buildingForm;
	
	public BuildingModel(){
		
	}

	public BuildingForm getBuildingForm() {
		return buildingForm;
	}

	public void setBuildingForm(BuildingForm buildingForm) {
		this.buildingForm = buildingForm;
	}
	
	
	/**
	 * get all buildings of allowed units
	 * @return
	 * @throws ShfException
	 */
	public ArrayList<BuildingForm> getAllBuildings() throws ShfException{
		ArrayList<BuildingForm> array=null;
		String sql="SELECT * FROM SHIFTER.shf_building where ORG_UNIT_CODE in ( ";
		Vector<String> units=buildingForm.getAllowedUnits();
		for(int i=0;i<units.size();i++){
			sql+=units.get(i);
			if(i<units.size()-1){
				sql+=",";
			}
		}
		sql+=")";
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql);
			db.executeQuery();
			array=new ArrayList<BuildingForm>();
			BuildingForm building=null;
			while(db.next()){
				building=new BuildingForm();
				db.populate(building);
				array.add(building);
			}
		} catch (DBQueryNoRowsException e) {
			
		} catch (DBException e) {
			logger.error(e);
			ActionError actionError=new ActionError("shf.error.insertFailed");
			throw new ShfException(actionError);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
		
		
		return array;
	}

	public BuildingForm populateBuilding() throws ShfException{
		BuildingForm building=null;
		String sql="SELECT * FROM SHIFTER.shf_building  where id=?  ";
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql);
			db.setInt(1, buildingForm.getCode());
			db.executeQuery();
			
			if(db.next()){
				building=new BuildingForm();
				db.populate(building);
			}
		} catch (DBQueryNoRowsException e) {
			
		} catch (DBException e) {
			logger.error(e);
			ActionError actionError=new ActionError("shf.error.insertFailed");
			throw new ShfException(actionError);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
		
		return building;
	}
	
	/**
	 * insert a new building
	 * @throws ShfException
	 */
	public void addBuilding() throws ShfException{
		logger.debug("Starting addBuilding()");
		int param=1;
		int code=0;
		String sql="INSERT INTO SHIFTER.shf_building(ID,NAME,ORG_UNIT_CODE,ADDRESS,SEATS_NUMBER) values (SHIFTER.SHF_BUILDING_ID.nextval,?,?,?,?) ";
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql);
			db.setString(param++,buildingForm.getName());
			db.setString(param++,buildingForm.getOrgUnit());
			db.setString(param++,buildingForm.getAddress());
			db.setInt(param++,buildingForm.getSeatsNum());
			db.executeUpdate();
			
		} catch (DBException e) {
			logger.error(e);
			ActionError actionError=new ActionError("shf.error.insertFailed");
			throw new ShfException(actionError);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
	}
	
	
	public void updateBuilding() throws ShfException{
		logger.debug("Starting updateBuilding()");
		int param=1;
		String sql="UPDATE SHIFTER.shf_building set NAME=?, ORG_UNIT_CODE=?, ADDRESS=?, SEATS_NUMBER=? WHERE id=? ";
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql);
			db.setString(param++,buildingForm.getName());
			db.setString(param++,buildingForm.getOrgUnit());
			db.setString(param++,buildingForm.getAddress());
			db.setInt(param++,buildingForm.getSeatsNum());
			db.setInt(param++,buildingForm.getCode());
			
			db.executeUpdate();
		} catch (DBException e) {
			logger.error(e);
			ActionError actionError=new ActionError("shf.error.insertFailed");
			throw new ShfException(actionError);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
	}

	public void deleteBuilding() throws ShfException{
		logger.debug("Starting BuildingModel : deleteBuilding(). Building id: "+buildingForm.getCode());
		String sqlDelTeamFromBuilding = "DELETE FROM shifter.shf_building_team WHERE building_id = ? ";
		String sqlDelBuilding = "DELETE FROM SHIFTER.shf_building WHERE id = ? ";
		DBAccess db=null;
		
		try { // first delete team from building (parent child restriction)
			db=new DBAccess();
			db.prepareStatement(sqlDelTeamFromBuilding);
			db.setInt(1,buildingForm.getCode());
			db.executeUpdate();
		} catch (DBException e) {
			logger.error(e);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
		
		db=null;
		
		try { // delete building
			db=new DBAccess();
			db.prepareStatement(sqlDelBuilding);
			db.setInt(1,buildingForm.getCode());
			db.executeUpdate();
		} catch (DBException e) {
			logger.error(e);
			ActionError actionError=new ActionError("shf.error.insertFailed");
			throw new ShfException(actionError);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
	} // END METHOD

	public ArrayList<TeamForm> getTeamsBuildings() throws ShfException{
		StringBuffer sql=new StringBuffer();
		sql.append("select u.org_unit_id as code , u.org_unit_name as description , u.parent_unit as parent, ");
		sql.append("u.unit_type_id as type,t.building_id,b.name as building_name from shifter.shf_org_unit u "); 
		sql.append("left join shifter.shf_building_team t on t.team_unit_code=u.org_unit_id ");
		sql.append("left join shifter.shf_building b on b.id=t.building_id ");
		sql.append("where u.parent_unit=? order by u.org_unit_name");
		
		ArrayList<TeamForm> teams=new ArrayList<TeamForm>();
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql.toString());
			db.setString(1,buildingForm.getOrgUnit());
			
			db.executeQuery();
			TeamForm team=null;
			while(db.next()){
				team=new TeamForm();
				db.populate(team);
				teams.add(team);
			}
		}catch (DBQueryNoRowsException e) {
			
		}catch (DBException e) {
			logger.error(e);
			ActionError actionError=new ActionError("shf.error.populateFailed");
			throw new ShfException(actionError);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
		return teams;
	}

	
	public ArrayList<BuildingForm> getBuildingsByMoked(String moked) throws ShfException{
		ArrayList<BuildingForm> array=null;
		String sql="SELECT * FROM SHIFTER.shf_building where ORG_UNIT_CODE = ?";
		
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql);
			db.setString(1, moked);
			db.executeQuery();
			array=new ArrayList<BuildingForm>();
			BuildingForm building=null;
			while(db.next()){
				building=new BuildingForm();
				db.populate(building);
				array.add(building);
			}
		} catch (DBQueryNoRowsException e) {
			
		} catch (DBException e) {
			logger.error(e);
			ActionError actionError=new ActionError("shf.error.insertFailed");
			throw new ShfException(actionError);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
		return array;
	}
	
	
	public BuildingForm getBuildingByTeam(String teamCode) throws ShfException{
		BuildingForm building=null;
		String sql="select b.* from shifter.shf_building_team t left join shifter.shf_building b on t.building_id=b.id where t.team_unit_code=?";
		
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql);
			db.setString(1, teamCode);
			db.executeQuery();
			if(db.next()){
				building=new BuildingForm();
				db.populate(building);
			}
		} catch (DBQueryNoRowsException e) {
			
		} catch (DBException e) {
			logger.error(e);
			ActionError actionError=new ActionError("shf.error.populateFailed");
			throw new ShfException(actionError);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
		return building;
	}
	

	public void updateTeamBuilding(TeamForm teamForm) throws ShfException{
		String sqlDelete="DELETE FROM SHIFTER.shf_building_team where TEAM_UNIT_CODE = ?";
		String sqlInsert="INSERT INTO SHIFTER.shf_building_team(BUILDING_ID,TEAM_UNIT_CODE) values(?,?)";
		
		DBAccess db=null;
		try{
			try {
				db=new DBAccess(false);
				db.prepareStatement(sqlDelete);
				db.setString(1, teamForm.getCode());
				db.executeUpdate();
			}catch (DBUpdateNoRowsException e) {}
			
			if(teamForm.getBuildingId()>0){
				db.prepareStatement(sqlInsert);
				db.setInt(1, teamForm.getBuildingId());
				db.setString(2, teamForm.getCode());
				db.executeUpdate();
			}
			db.commit();
		}catch (Exception e) {
			try {
				db.rollback();
			} catch (DBException e1) {
				throw new ShfException("shf.error.insertFailed");
			}
			logger.error(e);
			ActionError actionError=new ActionError("shf.error.insertFailed");
			throw new ShfException(actionError);
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
	}

}
