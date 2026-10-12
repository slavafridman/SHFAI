package bzq.shf.taglib;

import java.util.ArrayList;

import javax.servlet.jsp.JspException;

import org.apache.struts.util.ResponseUtils;

import bzq.shf.forms.BuildingForm;
import bzq.shf.utils.SHFTableUtils;
import bzq.taglib.BaseHandlerTag;

public class BuildingSelectTag extends BaseHandlerTag{
	
	private static final long serialVersionUID = 8736892012329513802L;
	private String moked;
	private String building;
	private String teamId;
	
	public int doStartTag() throws JspException {
		ResponseUtils.write(pageContext,"<select");
		if(getOnchange()!=null){
			ResponseUtils.write(pageContext," onchange="+getOnchange());
		}
		if(teamId!=null){
			ResponseUtils.write(pageContext," id=building"+teamId);
		}
		ResponseUtils.write(pageContext,">");
		ArrayList<BuildingForm> array=SHFTableUtils.getBuildingsByMoked(moked);
		if(array!=null && array.size()>0){
			ResponseUtils.write(pageContext,"<option value=0></option>");
			for(BuildingForm bld:array){
				ResponseUtils.write(pageContext,"<option value="+bld.getCode());
				if(Integer.valueOf(building)==bld.getCode()){
					ResponseUtils.write(pageContext," selected=selected");
				}
				ResponseUtils.write(pageContext," >");
				ResponseUtils.write(pageContext,bld.getName());
				ResponseUtils.write(pageContext,"</option>");
			}
		}
		ResponseUtils.write(pageContext,"</select>");
		return SKIP_BODY;
	}

	public String getMoked() {
		return moked;
	}

	public void setMoked(String moked) {
		this.moked = moked;
	}

	public String getBuilding() {
		return building;
	}

	public void setBuilding(String building) {
		this.building = building;
	}

	public String getTeamId() {
		return teamId;
	}

	public void setTeamId(String teamId) {
		this.teamId = teamId;
	}
	
	
	
}
